import type { Denops } from "https://deno.land/x/denops_std@v6.4.0/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v6.4.0/function/mod.ts";
import * as opt from "https://deno.land/x/denops_std@v6.4.0/option/mod.ts";
import { g } from "https://deno.land/x/denops_std@v6.4.0/variable/mod.ts";
import {
  batch,
  collect,
} from "https://deno.land/x/denops_std@v6.4.0/batch/mod.ts";
import { is, type Predicate } from "jsr:@core/unknownutil@3.18.0";

import type {
  Item,
  Previewer,
  Projector,
  Renderer,
  SourceItem,
  Transformer,
} from "../extension/type.ts";
import { any, isDefined } from "../util/collection.ts";
import { startAsyncScheduler } from "../util/async_scheduler.ts";
import { subscribe } from "../util/event.ts";
import {
  buildLayout,
  isLayoutParams,
  Layout,
  LayoutParams,
} from "./layout/picker_layout.ts";
import { QueryComponent } from "./component/query.ts";
import { SelectorComponent } from "./component/selector.ts";
import { PreviewComponent } from "./component/preview.ts";
import { observeInput, startInput } from "./util/input.ts";
import { ItemCollector } from "./util/item_collector.ts";
import { ItemProcessor } from "./util/item_processor.ts";

export type PickerContext = {
  query: string;
  cursor: number;
  selected: Set<unknown>;
};

export type PickerOptions = Readonly<{
  selectable?: boolean;
  layout?: Partial<LayoutParams>;
  query?: Readonly<{
    spinner?: readonly string[];
    headSymbol?: string;
    failSymbol?: string;
  }>;
  preview?: Readonly<{
    debounceWait?: number;
  }>;
  updateInterval?: number;
}>;

export const isPickerOptions = is.PartialOf(is.ObjectOf({
  layout: is.PartialOf(isLayoutParams),
  query: is.PartialOf(is.ObjectOf({
    spinner: is.ArrayOf(is.String),
    headSymbol: is.String,
    failSymbol: is.String,
  })),
  preview: is.PartialOf(is.ObjectOf({
    debounceWait: is.Number,
  })),
  updateInterval: is.Number,
})) satisfies Predicate<PickerOptions>;

export class Picker implements AsyncDisposable {
  #title: string;
  #renderers: readonly Renderer[];
  #previewers: readonly Previewer[];
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
    options: PickerOptions,
    context?: PickerContext,
  ) {
    const stack = new AsyncDisposableStack();
    // Start collecting source items
    const itemCollector = stack.use(new ItemCollector(stream));
    itemCollector.start();

    const itemProcessor = stack.use(
      new ItemProcessor(transformers, projectors),
    );

    this.#title = title;
    this.#renderers = renderers;
    this.#previewers = previewers;
    this.#options = options;
    this.#context = context ?? {
      query: "",
      cursor: 0,
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
    return this.processedItems.at(this.#context.cursor);
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
        debounceWait: this.#options.preview?.debounceWait ??
          PREVIEW_DEBOUNCE_WAIT,
      },
    );

    // Subscribe custom events
    stack.use(subscribe("item-collector-changed", () => {
      query.collecting = true;
      query.counter = {
        processed: this.processedItems.length,
        collected: this.collectedItems.length,
      };
      query.processing = true;
      this.#itemProcessor.start(this.collectedItems, this.#context.query);
    }));
    stack.use(subscribe("item-collector-succeeded", () => {
      query.collecting = false;
    }));
    stack.use(subscribe("item-collector-failed", () => {
      query.collecting = "failed";
    }));
    stack.use(subscribe("item-processor-succeeded", () => {
      query.processing = false;
      query.counter = {
        processed: this.processedItems.length,
        collected: this.collectedItems.length,
      };
      selector.items = this.processedItems;
      selector.index = this.#context.cursor;
      preview.item = this.cursorItem;
    }));
    stack.use(subscribe("item-processor-failed", () => {
      query.processing = "failed";
    }));
    stack.use(subscribe("cmdline-changed", (cmdline) => {
      this.#context.query = cmdline;
      this.#itemProcessor.start(this.collectedItems, cmdline);
      query.cmdline = cmdline;
    }));
    stack.use(subscribe("cmdpos-changed", (cmdpos) => {
      query.cmdpos = cmdpos;
    }));
    stack.use(subscribe("selector-cursor-move", (offset) => {
      const nextIndex = Math.max(
        0,
        Math.min(this.processedItems.length - 1, this.#context.cursor + offset),
      );
      this.#context.cursor = nextIndex;
      selector.index = nextIndex;
    }));
    stack.use(subscribe("selector-cursor-move-at", (line) => {
      if (line === "$") {
        this.#context.cursor = this.processedItems.length - 1;
      } else {
        this.#context.cursor = Math.max(
          0,
          Math.min(this.processedItems.length - 1, line - 1),
        );
      }
      selector.index = this.#context.cursor;
    }));
    stack.use(subscribe("preview-cursor-move", (offset) => {
      preview.moveCursor(denops, offset, { signal: options.signal });
    }));
    stack.use(subscribe("preview-cursor-move-at", (line) => {
      preview.moveCursorAt(denops, line, { signal: options.signal });
    }));
    if (this.#options.selectable) {
      stack.use(subscribe("selector-select", () => {
        const item = this.cursorItem;
        if (!item) return;
        if (this.#context.selected.has(item.id)) {
          this.#context.selected.delete(item.id);
        } else {
          this.#context.selected.add(item.id);
        }
        selector.selected = new Set(this.#context.selected);
      }));
      stack.use(subscribe("selector-select-all", () => {
        if (this.#context.selected.size === this.processedItems.length) {
          this.#context.selected.clear();
        } else {
          this.#context.selected = new Set(
            this.processedItems.map((v) => v.id),
          );
        }
        selector.selected = new Set(this.#context.selected);
      }));
    }

    // Update UI in background
    stack.use(startAsyncScheduler(
      async () => {
        const isUpdated = any([
          await query.render(denops, { signal }),
          await selector.render(denops, { signal }),
        ]);
        preview.render(denops, { signal })
          .then((isUpdated) => {
            if (isUpdated) {
              return denops.cmd(`redraw`);
            }
          })
          .catch((err) => {
            console.warn(`[fall] Failed to render preview: ${err}`);
          });
        if (isUpdated) {
          await denops.cmd(`redraw`);
        }
      },
      this.#options.updateInterval ?? UPDATE_INTERVAL,
      { signal },
    ));

    // Observe Vim's prompt
    stack.use(observeInput(denops, { signal }));

    // Wait for user input
    return await startInput(denops, { text: this.#context.query }, {
      signal,
    });
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
const UPDATE_INTERVAL = 20;
const PREVIEW_DEBOUNCE_WAIT = 100;
