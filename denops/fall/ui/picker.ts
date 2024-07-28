import type { Denops } from "jsr:@denops/std@7.0.0";
import * as opt from "jsr:@denops/std@7.0.0/option";
import { collect } from "jsr:@denops/std@7.0.0/batch";

import type {
  Item,
  Previewer,
  Projector,
  Renderer,
  SourceItem,
} from "../extension/type.ts";
import { subscribe } from "../util/event.ts";
import { isDefined } from "../util/collection.ts";
import { startAsyncScheduler } from "../util/async_scheduler.ts";
import { observeInput, startInput } from "./util/input.ts";
import type { Border } from "./util/border.ts";
import type { Divider } from "./util/divider.ts";
import type { Layout } from "./component/base.ts";
import { PickerComponent } from "./component/picker.ts";
import { ItemCollector } from "../service/item_collector.ts";
import { ItemProjector } from "../service/item_projector.ts";
import { ItemRenderer } from "../service/item_renderer.ts";
import { ItemPreviewer } from "../service/item_previewer.ts";

export type Context = {
  readonly query: string;
  readonly index: number;
  readonly selected: Set<unknown>;
};

export type Params = {
  readonly title: string;
  readonly stream: ReadableStream<SourceItem>;
  readonly projectors: readonly Projector[];
  readonly renderers: readonly Renderer[];
  readonly previewers: readonly Previewer[];
  readonly selectable?: boolean;
  readonly context?: Context;
};

export type Options = {
  readonly style?: {
    readonly widthMin?: number;
    readonly widthMax?: number;
    readonly widthRatio?: number;
    readonly heightMin?: number;
    readonly heightMax?: number;
    readonly heightRatio?: number;
    readonly previewRatio?: number;
    readonly border?: Border;
    readonly divider?: Divider;
    readonly zindex?: number;
  };
  readonly redraw?: {
    readonly interval?: number;
  };
  readonly query?: {
    readonly spinner?: readonly string[];
    readonly headSymbol?: string;
    readonly failSymbol?: string;
  };
  readonly preview?: {
    readonly mode?: "fast" | "correct";
  };
  readonly itemCollector?: {
    readonly threshold?: number;
  };
};

export class Picker implements Disposable {
  readonly #stack: DisposableStack;
  readonly #selectable: boolean;
  readonly #itemCollector: ItemCollector;
  readonly #itemProjector: ItemProjector;
  readonly #itemRenderer: ItemRenderer;
  readonly #itemPreviewer: ItemPreviewer;
  readonly #options: Options;
  readonly #picker: PickerComponent;

  #index = 0;

  constructor(
    {
      title,
      stream,
      projectors,
      renderers,
      previewers,
      selectable,
      context,
    }: Params,
    options: Options,
  ) {
    using stack = new DisposableStack();
    const itemCollector = stack.use(
      new ItemCollector({
        stream,
        threshold: options.itemCollector?.threshold,
      }),
    );
    const itemProjector = stack.use(
      new ItemProjector({ projectors }),
    );
    const itemRenderer = stack.use(
      new ItemRenderer({ renderers }),
    );
    const itemPreviewer = stack.use(
      new ItemPreviewer({ previewers }),
    );
    this.#selectable = selectable ?? false;
    this.#itemCollector = itemCollector;
    this.#itemProjector = itemProjector;
    this.#itemRenderer = itemRenderer;
    this.#itemPreviewer = itemPreviewer;
    this.#options = options;
    this.#picker = new PickerComponent({
      previewRatio: previewers.length === 0
        ? 0
        : options.style?.previewRatio ?? PREVIEW_RATIO,
      previewMode: options.preview?.mode ?? "fast",
      title,
      border: options.style?.border ?? "single",
      divider: options.style?.divider ?? "dashed",
      zindex: options.style?.zindex,
      spinner: options.query?.spinner,
      headSymbol: options.query?.headSymbol,
      failSymbol: options.query?.failSymbol,
    });
    if (context) {
      this.#index = context.index;
      this.#picker.query.cmdline = context.query;
      this.#picker.select.line = 1 + Math.max(0, context.index);
      this.#picker.select.selected = context.selected;
    }
    this.#stack = stack.move();
  }

  get context(): Context {
    return {
      index: this.#index,
      query: this.#picker.query.cmdline,
      selected: this.#picker.select.selected,
    };
  }

  get collectedItems(): readonly Item[] {
    return this.#itemCollector.items;
  }

  get projectedItems(): readonly Item[] {
    return this.#itemProjector.items;
  }

  get selectedItems(): readonly Item[] {
    const m = new Map(this.projectedItems.map((v) => [v.id, v]));
    return [...this.#picker.select.selected].map((v) => m.get(v)).filter(
      isDefined,
    );
  }

  get cursorItem(): Item | undefined {
    return this.projectedItems.at(this.#index);
  }

  #correctIndex(index: number): number {
    const max = this.projectedItems.length - 1;
    return Math.max(0, Math.min(max, index));
  }

  async #calcLayout(denops: Denops): Promise<Layout> {
    const [screenWidth, screenHeight] = await collect(
      denops,
      (denops) => [
        opt.columns.get(denops),
        opt.lines.get(denops),
      ],
    );
    const width = calc(
      screenWidth,
      this.#options.style?.widthRatio ?? WIDTH_RATIO,
      this.#options.style?.widthMin ?? WIDTH_MIN,
      this.#options.style?.widthMax ?? WIDTH_MAX,
    );
    const height = calc(
      screenHeight,
      this.#options.style?.heightRatio ?? HEIGHT_RATIO,
      this.#options.style?.heightMin ?? HEIGHT_MIN,
      this.#options.style?.heightMax ?? HEIGHT_MAX,
    );
    const col = Math.floor((screenWidth - width) / 2);
    const row = Math.floor((screenHeight - height) / 2);
    return { width, height, col, row };
  }

  async open(denops: Denops): Promise<AsyncDisposable> {
    const layout = await this.#calcLayout(denops);
    await this.#picker.move(denops, layout);
    return this.#picker.open(denops);
  }

  async start(
    denops: Denops,
    options: { signal: AbortSignal },
  ): Promise<boolean> {
    await using stack = new AsyncDisposableStack();
    const controller = new AbortController();
    const signal = AbortSignal.any([options.signal, controller.signal]);
    stack.defer(() => {
      try {
        controller.abort();
      } catch {
        // Fail silently
      }
    });

    const scrolloff = await opt.scrolloff.get(denops);
    signal.throwIfAborted();

    const emitItemProjector = () => {
      this.#itemProjector.start({
        items: this.collectedItems,
        query: this.#picker.query.cmdline,
      }, {
        signal,
      });
    };
    const emitItemRenderer = () => {
      this.#itemRenderer.start({
        items: this.projectedItems,
        index: this.#index,
        width: this.#picker.select.width,
        height: this.#picker.select.height,
        scrolloff,
      }, {
        signal,
      });
    };
    const emitItemPreviewer = () => {
      this.#itemPreviewer.start({
        item: this.cursorItem,
        width: this.#picker.preview.width,
        height: this.#picker.preview.height,
      }, {
        signal,
      });
    };

    stack.use(subscribe("item-collector-changed", () => {
      this.#picker.query.collecting = true;
      this.#picker.query.counter = {
        collected: this.#itemCollector.items.length,
        projected: this.#itemProjector.items.length,
        truncated: this.#itemCollector.truncated,
      };
      emitItemProjector();
    }));
    stack.use(subscribe("item-collector-succeeded", () => {
      this.#picker.query.collecting = false;
      this.#picker.query.processing = true;
      this.#picker.query.counter = {
        collected: this.#itemCollector.items.length,
        projected: this.#itemProjector.items.length,
        truncated: this.#itemCollector.truncated,
      };
      emitItemProjector();
    }));
    stack.use(subscribe("item-collector-failed", () => {
      this.#picker.query.collecting = "failed";
    }));
    stack.use(subscribe("item-projector-succeeded", () => {
      this.#index = this.#correctIndex(this.#index);
      this.#picker.query.processing = false;
      this.#picker.query.counter = {
        collected: this.#itemCollector.items.length,
        projected: this.#itemProjector.items.length,
        truncated: this.#itemCollector.truncated,
      };
      emitItemRenderer();
      emitItemPreviewer();
    }));
    stack.use(subscribe("item-projector-failed", () => {
      this.#picker.query.processing = "failed";
    }));
    stack.use(subscribe("item-renderer-succeeded", () => {
      this.#picker.select.items = this.#itemRenderer.items;
      this.#picker.select.line = 1 + Math.max(
        0,
        this.#index - this.#itemRenderer.offset,
      );
    }));
    stack.use(subscribe("item-previewer-succeeded", () => {
      this.#picker.preview.title = this.#itemPreviewer.name;
      this.#picker.preview.preview = this.#itemPreviewer.preview;
    }));
    stack.use(subscribe("vim-resized", () => {
      this.#calcLayout(denops).then(async (layout) => {
        await this.#picker.move(denops, layout);
        await denops.cmd("redraw");
      });
    }));
    stack.use(subscribe("cmdline-changed", (cmdline) => {
      this.#picker.query.cmdline = cmdline;
      emitItemProjector();
    }));
    stack.use(subscribe("cmdpos-changed", (cmdpos) => {
      this.#picker.query.cmdpos = cmdpos;
    }));
    stack.use(subscribe("select-cursor-move", (offset) => {
      const newIndex = this.#correctIndex(this.#index + offset);
      if (this.#index === newIndex) {
        return;
      }
      this.#index = newIndex;
      emitItemRenderer();
      emitItemPreviewer();
    }));
    stack.use(subscribe("select-cursor-move-at", (line) => {
      const newIndex = this.#correctIndex(
        line === "$" ? this.projectedItems.length - 1 : line - 1,
      );
      if (this.#index === newIndex) {
        return;
      }
      this.#index = newIndex;
      emitItemRenderer();
      emitItemPreviewer();
    }));
    stack.use(subscribe("preview-cursor-move", (offset) => {
      this.#picker.movePreviewCursor(denops, offset, { signal });
    }));
    stack.use(subscribe("preview-cursor-move-at", (line) => {
      this.#picker.movePreviewCursorAt(denops, line, { signal });
    }));
    stack.use(subscribe("preview-cursor-move-horizontal", (offset) => {
      this.#picker.movePreviewCursorH(denops, offset, { signal });
    }));
    stack.use(subscribe("preview-previewer-rotate", (offset) => {
      this.#itemPreviewer.index += offset;
      emitItemPreviewer();
    }));
    if (this.#selectable) {
      stack.use(subscribe("select-select", () => {
        const item = this.cursorItem;
        if (!item) return;
        if (this.#picker.select.selected.has(item.id)) {
          this.#picker.select.selected.delete(item.id);
        } else {
          this.#picker.select.selected.add(item.id);
        }
      }));
      stack.use(subscribe("select-select-all", () => {
        if (this.#picker.select.selected.size === this.projectedItems.length) {
          this.#picker.select.selected.clear();
        } else {
          this.#picker.select.selected = new Set(
            this.projectedItems.map((v) => v.id),
          );
        }
      }));
    }

    startAsyncScheduler(
      async () => {
        const skipped = await this.#picker.render(denops, { signal });
        if (!skipped) {
          await denops.cmd("redraw");
        }
      },
      this.#options.redraw?.interval ?? REDRAW_INTERVAL,
      { signal },
    );

    // Observe Vim's prompt
    stack.use(observeInput(denops, { signal }));

    // Start collecting
    this.#itemCollector.start({ signal });

    // Wait for user input
    return await startInput(
      denops,
      { text: this.#picker.query.cmdline },
      { signal },
    );
  }

  [Symbol.dispose]() {
    return this.#stack.dispose();
  }
}

function calc(value: number, ratio: number, min: number, max: number): number {
  return Math.floor(Math.max(min, Math.min(max, value * ratio)));
}

const WIDTH_RATIO = 0.9;
const WIDTH_MIN = 80;
const WIDTH_MAX = 800;
const HEIGHT_RATIO = 0.9;
const HEIGHT_MIN = 5;
const HEIGHT_MAX = 300;
const PREVIEW_RATIO = 0.65;
const REDRAW_INTERVAL = 0;
