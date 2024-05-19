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
import { throttle } from "../util/throttle.ts";
import { debounce } from "../util/debounce.ts";
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
  cursor: number;
  selected: Set<unknown>;
};

export type PickerOptions = Readonly<{
  layout?: Partial<LayoutParams>;
  redraw?: Readonly<{
    throttleWait?: number;
  }>;
  query?: Readonly<{
    spinner?: readonly string[];
    headSymbol?: string;
    failSymbol?: string;
    throttleWait?: number;
  }>;
  selector?: Readonly<{
    throttleWait?: number;
  }>;
  preview?: Readonly<{
    throttleWait?: number;
    debounceWait?: number;
  }>;
  itemProcessor?: Readonly<{
    throttleWait?: number;
    debounceWait?: number;
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
    // Start collecting source items
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

  #correctCursor(cursor: number): number {
    const max = this.processedItems.length - 1;
    return Math.max(0, Math.min(max, cursor));
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

    // Start collecting
    this.#itemCollector.start({ signal });

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

    const redraw = throttle(() => {
      denops.cmd("redraw").catch((err) => {
        const m = err.message ?? err;
        console.debug(`Failed to execute 'redraw': ${m}`);
      });
    }, this.#options.redraw?.throttleWait ?? REDRAW_THROTTLE_WAIT);
    const updateQueryComponent = throttle(() => {
      query.render(
        denops,
        {
          cmdline: this.#context.cmdline,
          cmdpos: this.#context.cmdpos,
          collecting: this.#itemCollector.collecting,
          processing: this.#itemProcessor.processing ||
            this.#itemCollector.collecting,
          counter: {
            collected: this.collectedItems.length,
            processed: this.processedItems.length,
          },
        },
        { signal },
      ).then(() => redraw());
    }, this.#options.query?.throttleWait ?? QUERY_THROTTLE_WAIT);
    const updateSelectorComponent = throttle(() => {
      selector.render(
        denops,
        this.processedItems,
        this.#context.cursor,
        this.#context.selected,
        { signal },
      ).then(() => redraw());
    }, this.#options.selector?.throttleWait ?? SELECTOR_THROTTLE_WAIT);
    const updatePreviewComponent = throttle(() => {
      preview.render(
        denops,
        this.cursorItem,
        { signal },
      ).then(() => redraw());
    }, this.#options.preview?.throttleWait ?? PREVIEW_THROTTLE_WAIT);
    const updatePreviewComponentDebounce = debounce(() => {
      updatePreviewComponent();
    }, this.#options.preview?.debounceWait ?? PREVIEW_DEBOUNCE_WAIT);
    const startItemProcessor = throttle(
      () => {
        this.#itemProcessor.start(
          this.collectedItems,
          { query: this.#context.cmdline },
          { signal },
        );
      },
      this.#options.itemProcessor?.throttleWait ??
        INPUT_PROCESSOR_THROTTLE_WAIT,
    );
    const startItemProcessorDebounce = debounce(
      () => {
        startItemProcessor();
      },
      this.#options.itemProcessor?.debounceWait ??
        INPUT_PROCESSOR_DEBOUNCE_WAIT,
    );

    // Subscribe custom events
    stack.use(subscribe("item-collector-changed", () => {
      updateQueryComponent();
      startItemProcessor();
    }));
    stack.use(subscribe("item-collector-succeeded", () => {
      updateQueryComponent();
    }));
    stack.use(subscribe("item-collector-failed", () => {
      updateQueryComponent();
    }));
    stack.use(subscribe("item-processor-succeeded", () => {
      this.#context.cursor = this.#correctCursor(this.#context.cursor);
      updateQueryComponent();
      updateSelectorComponent();
      updatePreviewComponent();
    }));
    stack.use(subscribe("item-processor-failed", () => {
      updateQueryComponent();
    }));
    stack.use(subscribe("cmdline-changed", (cmdline) => {
      this.#context.cmdline = cmdline;
      updateQueryComponent();
      startItemProcessorDebounce();
    }));
    stack.use(subscribe("cmdpos-changed", (cmdpos) => {
      this.#context.cmdpos = cmdpos;
      updateQueryComponent();
    }));
    stack.use(subscribe("selector-cursor-move", (offset) => {
      this.#context.cursor = this.#correctCursor(this.#context.cursor + offset);
      updateSelectorComponent();
      updatePreviewComponentDebounce();
    }));
    stack.use(subscribe("selector-cursor-move-at", (line) => {
      const cursor = line === "$" ? this.processedItems.length - 1 : line - 1;
      this.#context.cursor = this.#correctCursor(cursor);
      updateSelectorComponent();
      updatePreviewComponentDebounce();
    }));
    stack.use(subscribe("preview-cursor-move", (offset) => {
      preview.moveCursor(denops, offset, { signal: options.signal });
      redraw();
    }));
    stack.use(subscribe("preview-cursor-move-at", (line) => {
      preview.moveCursorAt(denops, line, { signal: options.signal });
      redraw();
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
        updateSelectorComponent();
      }));
      stack.use(subscribe("selector-select-all", () => {
        if (this.#context.selected.size === this.processedItems.length) {
          this.#context.selected.clear();
        } else {
          this.#context.selected = new Set(
            this.processedItems.map((v) => v.id),
          );
        }
        updateSelectorComponent();
      }));
    }

    // Observe Vim's prompt
    stack.use(observeInput(denops, { signal }));

    // Wait for user input
    return await startInput(denops, { text: this.#context.cmdline }, {
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
const REDRAW_THROTTLE_WAIT = 30;
const QUERY_THROTTLE_WAIT = 20;
const SELECTOR_THROTTLE_WAIT = 20;
const PREVIEW_THROTTLE_WAIT = 200;
const PREVIEW_DEBOUNCE_WAIT = 300;
const INPUT_PROCESSOR_THROTTLE_WAIT = 200;
const INPUT_PROCESSOR_DEBOUNCE_WAIT = 300;
