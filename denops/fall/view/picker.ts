import type { Denops } from "https://deno.land/x/denops_std@v6.4.0/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v6.4.0/function/mod.ts";
import * as opt from "https://deno.land/x/denops_std@v6.4.0/option/mod.ts";
import { g } from "https://deno.land/x/denops_std@v6.4.0/variable/mod.ts";
import {
  batch,
  collect,
} from "https://deno.land/x/denops_std@v6.4.0/batch/mod.ts";

import type {
  Item,
  Previewer,
  Projector,
  Renderer,
  SourceItem,
  Transformer,
} from "../extension/type.ts";
import { isDefined } from "../util/collection.ts";
import { subscribe } from "../util/event.ts";
import { startAsyncScheduler } from "../util/async_scheduler.ts";
import { buildLayout, Layout, LayoutParams } from "./layout/picker_layout.ts";
import { QueryComponent } from "./component/query.ts";
import { SelectorComponent } from "./component/selector.ts";
import { PreviewComponent } from "./component/preview.ts";
import { observeInput, startInput } from "./util/input.ts";
import { ItemCollector } from "./util/item_collector.ts";
import { ItemProcessor } from "./util/item_processor.ts";

export type PickerContext = {
  cmdline: string;
  cmdpos: number;
  index: number;
  selected: Set<unknown>;
};

export type PickerOptions = Readonly<{
  layout?: Partial<LayoutParams>;
  redraw?: Readonly<{
    interval?: number;
  }>;
  query?: Readonly<{
    spinner?: readonly string[];
    headSymbol?: string;
    failSymbol?: string;
  }>;
}>;

export class Picker implements AsyncDisposable {
  #title: string;
  #renderers: readonly Renderer[];
  #previewers: readonly Previewer[];
  #selectable: boolean;
  #options: PickerOptions;
  #context: PickerContext;

  #layout?: Layout;
  #itemCollector: ItemCollector;
  #itemProcessor: ItemProcessor;
  #disposable: AsyncDisposableStack;

  constructor(
    title: string,
    stream: ReadableStream<SourceItem>,
    transformers: readonly Transformer[],
    projectors: readonly Projector[],
    renderers: readonly Renderer[],
    previewers: readonly Previewer[],
    options: PickerOptions & { selectable?: boolean },
    context?: PickerContext,
  ) {
    const stack = new AsyncDisposableStack();
    const itemCollector = stack.use(new ItemCollector(stream));
    const itemProcessor = stack.use(
      new ItemProcessor(transformers, projectors),
    );

    this.#title = title;
    this.#renderers = renderers;
    this.#previewers = previewers;
    this.#selectable = options.selectable ?? false;
    this.#options = options;
    this.#context = context ?? {
      cmdline: "",
      cmdpos: 0,
      index: 0,
      selected: new Set(),
    };
    this.#itemCollector = itemCollector;
    this.#itemProcessor = itemProcessor;
    this.#disposable = stack;
  }

  get context(): PickerContext {
    return this.#context;
  }

  get collectedItems(): readonly Item[] {
    return this.#itemCollector.items;
  }

  get processedItems(): readonly Item[] {
    return this.#itemProcessor.items;
  }

  get selectedItems(): readonly Item[] {
    const m = new Map(this.processedItems.map((v) => [v.id, v]));
    return [...this.#context.selected].map((v) => m.get(v)).filter(isDefined);
  }

  get cursorItem(): Item | undefined {
    return this.processedItems.at(this.#context.index);
  }

  #correctIndex(index: number): number {
    const max = this.processedItems.length - 1;
    return Math.max(0, Math.min(max, index));
  }

  async open(denops: Denops): Promise<AsyncDisposable> {
    if (this.#layout) {
      throw new Error("The picker is already opened");
    }
    this.#layout = await buildLayout(denops, {
      title: ` ${this.#title} `,
      width: this.#options.layout?.width,
      widthRatio: this.#options.layout?.widthRatio ?? WIDTH_RATION,
      widthMin: this.#options.layout?.widthMin ?? WIDTH_MIN,
      widthMax: this.#options.layout?.widthMax ?? WIDTH_MAX,
      height: this.#options.layout?.height,
      heightRatio: this.#options.layout?.heightRatio ?? HEIGHT_RATION,
      heightMin: this.#options.layout?.heightMin ?? HEIGHT_MIN,
      heightMax: this.#options.layout?.heightMax ?? HEIGHT_MAX,
      previewRatio: this.#options.layout?.previewRatio ?? PREVIEW_RATION,
      border: this.#options.layout?.border,
      divider: this.#options.layout?.divider,
      zindex: this.#options.layout?.zindex ?? 50,
    });
    this.#disposable.use(this.#layout);
    return {
      [Symbol.asyncDispose]: async () => {
        if (this.#layout) {
          await this.#layout[Symbol.asyncDispose]();
          this.#layout = undefined;
        }
      },
    };
  }

  async start(
    denops: Denops,
    options: { signal: AbortSignal },
  ): Promise<boolean> {
    if (!this.#layout) {
      throw new Error("The picker is not opnend");
    }
    const layout = this.#layout;

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

    // Set internal variables
    await batch(denops, async (denops) => {
      await g.set(
        denops,
        "_fall_layout_query_winid",
        layout.query.winid,
      );
      await g.set(
        denops,
        "_fall_layout_selector_winid",
        layout.selector.winid,
      );
      await g.set(
        denops,
        "_fall_layout_preview_winid",
        layout.preview.winid,
      );
    });

    // Collect informations
    const [scrolloff, queryWinwidth, selectorWinwidth, selectorWinheight] =
      await collect(
        denops,
        (denops) => [
          opt.scrolloff.get(denops),
          fn.winwidth(denops, layout.query.winid),
          fn.winwidth(denops, layout.selector.winid),
          fn.winheight(denops, layout.selector.winid),
        ],
      );

    // Bind components to the layout
    const query = new QueryComponent(
      layout.query.bufnr,
      layout.query.winid,
      {
        winwidth: queryWinwidth,
        spinner: this.#options.query?.spinner,
        headSymbol: this.#options.query?.headSymbol,
        failSymbol: this.#options.query?.failSymbol,
      },
    );
    const selector = new SelectorComponent(
      layout.selector.bufnr,
      layout.selector.winid,
      {
        scrolloff,
        winwidth: selectorWinwidth,
        winheight: selectorWinheight,
        renderers: this.#renderers,
      },
    );
    const preview = new PreviewComponent(
      layout.preview.bufnr,
      layout.preview.winid,
      {
        previewers: this.#previewers,
      },
    );

    let renderQuery = true;
    let renderSelector = true;
    let renderPreview = true;
    const emitQueryUpdate = () => {
      renderQuery = true;
    };
    const emitSelectorUpdate = () => {
      renderSelector = true;
    };
    const emitPreviewUpdate = () => {
      renderPreview = true;
    };
    const emitItemProcessor = () => {
      this.#itemProcessor.start(
        this.collectedItems,
        { query: this.#context.cmdline },
        { signal },
      );
    };

    stack.use(subscribe("item-collector-changed", () => {
      emitQueryUpdate();
      emitItemProcessor();
    }));
    stack.use(subscribe("item-collector-succeeded", () => {
      emitQueryUpdate();
      emitItemProcessor();
    }));
    stack.use(subscribe("item-collector-failed", () => {
      emitQueryUpdate();
    }));
    stack.use(subscribe("item-processor-succeeded", () => {
      this.#context.index = this.#correctIndex(this.#context.index);
      emitQueryUpdate();
      emitSelectorUpdate();
      emitPreviewUpdate();
    }));
    stack.use(subscribe("item-processor-failed", () => {
      emitQueryUpdate();
    }));
    stack.use(subscribe("cmdline-changed", (cmdline) => {
      if (this.#context.cmdline === cmdline) {
        return;
      }
      this.#context.cmdline = cmdline;
      emitQueryUpdate();
      emitItemProcessor();
    }));
    stack.use(subscribe("cmdpos-changed", (cmdpos) => {
      if (this.#context.cmdpos === cmdpos) {
        return;
      }
      this.#context.cmdpos = cmdpos;
      emitQueryUpdate();
    }));
    stack.use(subscribe("selector-cursor-move", (offset) => {
      const newIndex = this.#correctIndex(this.#context.index + offset);
      if (this.#context.index === newIndex) {
        return;
      }
      this.#context.index = newIndex;
      emitSelectorUpdate();
      emitPreviewUpdate();
    }));
    stack.use(subscribe("selector-cursor-move-at", (line) => {
      const newIndex = this.#correctIndex(
        line === "$" ? this.processedItems.length - 1 : line - 1,
      );
      if (this.#context.index === newIndex) {
        return;
      }
      this.#context.index = newIndex;
      emitSelectorUpdate();
      emitPreviewUpdate();
    }));
    stack.use(subscribe("preview-cursor-move", (offset) => {
      preview.moveCursor(denops, offset, { signal });
      emitPreviewUpdate();
    }));
    stack.use(subscribe("preview-cursor-move-at", (line) => {
      preview.moveCursorAt(denops, line, { signal });
      emitPreviewUpdate();
    }));
    if (this.#selectable) {
      stack.use(subscribe("selector-select", () => {
        const item = this.cursorItem;
        if (!item) return;
        if (this.#context.selected.has(item.id)) {
          this.#context.selected.delete(item.id);
        } else {
          this.#context.selected.add(item.id);
        }
        emitSelectorUpdate();
      }));
      stack.use(subscribe("selector-select-all", () => {
        if (this.#context.selected.size === this.processedItems.length) {
          this.#context.selected.clear();
        } else {
          this.#context.selected = new Set(
            this.processedItems.map((v) => v.id),
          );
        }
        emitSelectorUpdate();
      }));
    }

    startAsyncScheduler(
      async () => {
        const collecting = this.#itemCollector.collecting;
        const processing = this.#itemProcessor.processing;
        renderQuery ||= collecting || processing;

        if (!renderQuery && !renderSelector && !renderPreview) {
          // No need to render & redraw
          return;
        }

        if (renderQuery) {
          renderQuery = false;
          await query.render(
            denops,
            {
              cmdline: this.#context.cmdline,
              cmdpos: this.#context.cmdpos,
              collecting,
              processing,
              counter: {
                processed: this.processedItems.length,
                collected: this.collectedItems.length,
              },
            },
            { signal },
          );
        }

        if (renderSelector) {
          renderSelector = false;
          await selector.render(
            denops,
            {
              items: this.processedItems,
              index: this.#context.index,
              selected: this.#context.selected,
            },
            { signal },
          );
        }

        if (renderPreview) {
          renderPreview = false;
          await preview.render(
            denops,
            this.cursorItem,
            { signal },
          );
        }

        await denops.cmd("redraw");
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
      { text: this.#context.cmdline },
      { signal },
    );
  }

  async [Symbol.asyncDispose](): Promise<void> {
    await this.#disposable.disposeAsync();
  }
}

const WIDTH_RATION = 0.8;
const WIDTH_MIN = 80;
const WIDTH_MAX = 400;
const HEIGHT_RATION = 0.9;
const HEIGHT_MIN = 5;
const HEIGHT_MAX = 40;
const PREVIEW_RATION = 0.45;
const REDRAW_INTERVAL = 0;
