import type { Denops } from "https://deno.land/x/denops_std@v6.3.0/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v6.3.0/function/mod.ts";
import * as opt from "https://deno.land/x/denops_std@v6.3.0/option/mod.ts";
import { g } from "https://deno.land/x/denops_std@v6.3.0/variable/mod.ts";
import {
  batch,
  collect,
} from "https://deno.land/x/denops_std@v6.3.0/batch/mod.ts";
import type {
  Previewer,
  Processor,
  ProcessorItem,
  Renderer,
  Source,
} from "https://deno.land/x/fall_core@v0.3.0/mod.ts";

import { any, isDefined } from "../../util/collection.ts";
import { startAsyncScheduler } from "../../util/async_scheduler.ts";
import { subscribe } from "../../util/event.ts";
import {
  buildLayout,
  Layout,
  LayoutParams,
} from "../layout/prompt_top_preview_right.ts";
import { PromptComponent } from "../component/prompt.ts";
import { SelectorComponent } from "../component/selector.ts";
import { PreviewComponent } from "../component/preview.ts";
import { emitPickerEnter, emitPickerLeave } from "../util/emitter.ts";
import { observePrompt, startPrompt } from "../util/prompt.ts";
import { ItemCollector } from "../util/item_collector.ts";
import { ItemProcessor } from "../util/item_processor.ts";

export interface SourcePickerOptions {
  layout?: Partial<LayoutParams>;
  itemCollector?: {
    chunkSize?: number;
  };
  prompt?: {
    spinner?: string[];
    headSymbol?: string;
    failSymbol?: string;
  };
  preview?: {
    debounceWait?: number;
  };
  updateInterval?: number;
}

export class SourcePicker implements AsyncDisposable {
  #query = "";
  #index = 0;
  #selected: Set<unknown> = new Set();

  #renderers: Map<string, Renderer>;
  #previewer: Previewer | undefined;
  #options: SourcePickerOptions;
  #layout: Layout;
  #itemCollector: ItemCollector;
  #itemProcessor: ItemProcessor;
  #disposable: AsyncDisposableStack;

  private constructor(
    renderers: Map<string, Renderer>,
    previewer: Previewer | undefined,
    options: SourcePickerOptions,
    layout: Layout,
    itemCollector: ItemCollector,
    itemProcessor: ItemProcessor,
    disposable: AsyncDisposableStack,
  ) {
    this.#renderers = renderers;
    this.#previewer = previewer;
    this.#options = options;
    this.#layout = layout;
    this.#itemCollector = itemCollector;
    this.#itemProcessor = itemProcessor;
    this.#disposable = disposable;
  }

  static async create(
    denops: Denops,
    args: string[],
    source: Source,
    processors: Map<string, Processor>,
    renderers: Map<string, Renderer>,
    previewer: Previewer | undefined,
    options: SourcePickerOptions,
  ): Promise<SourcePicker> {
    const stack = new AsyncDisposableStack();
    const sourceStream = await source.getStream(denops, ...args);
    if (!sourceStream) {
      throw new Error("Failed to get source stream.");
    }

    // Build layout
    const layout = stack.use(
      await buildLayout(denops, {
        width: options.layout?.width,
        widthRatio: options.layout?.widthRatio ?? WIDTH_RATION,
        widthMin: options.layout?.widthMin ?? WIDTH_MIN,
        widthMax: options.layout?.widthMax ?? WIDTH_MAX,
        height: options.layout?.height,
        heightRatio: options.layout?.heightRatio ?? HEIGHT_RATION,
        heightMin: options.layout?.heightMin ?? HEIGHT_MIN,
        heightMax: options.layout?.heightMax ?? HEIGHT_MAX,
        previewWidth: options.layout?.previewWidth,
        previewWidthRatio: options.layout?.previewWidthRatio ??
          PREVIEW_WIDTH_RATION,
        previewWidthMin: options.layout?.previewWidthMin ??
          PREVIEW_WIDTH_MIN,
        previewWidthMax: options.layout?.previewWidthMax ??
          PREVIEW_WIDTH_MAX,
        border: options.layout?.border,
        zindex: options.layout?.zindex ?? 50,
      }),
    );

    // Start collecting source items
    const itemCollector = stack.use(
      new ItemCollector(sourceStream, {
        chunkSize: options.itemCollector?.chunkSize ?? SOURCE_ITEM_CHUNK_SIZE,
      }),
    );
    itemCollector.start();

    const itemProcessor = stack.use(new ItemProcessor(processors));

    return new SourcePicker(
      renderers,
      previewer,
      options,
      layout,
      itemCollector,
      itemProcessor,
      stack.move(),
    );
  }

  get collectedItems(): ProcessorItem[] {
    return this.#itemCollector.items;
  }

  get processedItems(): ProcessorItem[] {
    return this.#itemProcessor.items;
  }

  get selectedItems(): ProcessorItem[] {
    const m = new Map(this.processedItems.map((v) => [v.id, v]));
    return [...this.#selected].map((v) => m.get(v)).filter(isDefined);
  }

  get cursorItem(): ProcessorItem | undefined {
    return this.processedItems.at(this.#index);
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

    // Set internal variables
    await batch(denops, async (denops) => {
      await g.set(
        denops,
        "_fall_layout_prompt_winid",
        this.#layout.prompt.winid,
      );
      await g.set(
        denops,
        "_fall_layout_selector_winid",
        this.#layout.selector.winid,
      );
      await g.set(
        denops,
        "_fall_layout_preview_winid",
        this.#layout.preview.winid,
      );
    });

    // Collect informations
    const [scrolloff, promptWinwidth, selectorWinheight] = await collect(
      denops,
      (denops) => [
        opt.scrolloff.get(denops),
        fn.winwidth(denops, this.#layout.prompt.winid),
        fn.winheight(denops, this.#layout.selector.winid),
      ],
    );

    // Bind components to the layout
    const prompt = new PromptComponent(
      this.#layout.prompt.bufnr,
      this.#layout.prompt.winid,
      {
        winwidth: promptWinwidth,
        spinner: this.#options.prompt?.spinner,
        headSymbol: this.#options.prompt?.headSymbol,
        failSymbol: this.#options.prompt?.failSymbol,
      },
    );
    const selector = new SelectorComponent(
      this.#layout.selector.bufnr,
      this.#layout.selector.winid,
      {
        scrolloff,
        winheight: selectorWinheight,
        renderers: this.#renderers,
      },
    );
    const preview = new PreviewComponent(
      this.#layout.preview.bufnr,
      this.#layout.preview.winid,
      {
        previewer: this.#previewer,
        debounceWait: this.#options.preview?.debounceWait ??
          PREVIEW_DEBOUNCE_WAIT,
      },
    );

    // Subscribe custom events
    stack.use(subscribe("item-collector-changed", () => {
      prompt.collecting = true;
      prompt.counter = {
        processed: this.processedItems.length,
        collected: this.collectedItems.length,
      };
      prompt.processing = true;
      this.#itemProcessor.start(denops, this.collectedItems, this.#query);
    }));
    stack.use(subscribe("item-collector-succeeded", () => {
      prompt.collecting = false;
    }));
    stack.use(subscribe("item-collector-failed", () => {
      prompt.collecting = "failed";
    }));
    stack.use(subscribe("item-processor-succeeded", () => {
      prompt.processing = false;
      prompt.counter = {
        processed: this.processedItems.length,
        collected: this.collectedItems.length,
      };
      selector.items = this.processedItems;
      selector.index = this.#index;
      preview.item = this.cursorItem;
    }));
    stack.use(subscribe("item-processor-failed", () => {
      prompt.processing = "failed";
    }));
    stack.use(subscribe("cmdline-changed", (data) => {
      this.#query = data;
      this.#itemProcessor.start(denops, this.collectedItems, this.#query);
      prompt.cmdline = this.#query;
    }));
    stack.use(subscribe("cmdpos-changed", (data) => {
      prompt.cmdpos = data;
    }));
    stack.use(subscribe("selector-cursor-move", (data) => {
      const nextIndex = Math.max(
        0,
        Math.min(this.processedItems.length - 1, this.#index + data),
      );
      this.#index = nextIndex;
      selector.index = this.#index;
    }));
    stack.use(subscribe("selector-cursor-move-at", (data) => {
      if (data === "$") {
        this.#index = this.processedItems.length - 1;
      } else {
        this.#index = Math.max(
          0,
          Math.min(this.processedItems.length - 1, data),
        );
      }
      selector.index = this.#index;
    }));
    stack.use(subscribe("selector-select", () => {
      const item = this.cursorItem;
      if (!item) return;
      if (this.#selected.has(item.id)) {
        this.#selected.delete(item.id);
      } else {
        this.#selected.add(item.id);
      }
      selector.selected = new Set(this.#selected);
    }));
    stack.use(subscribe("selector-select-all", () => {
      if (this.#selected.size === this.processedItems.length) {
        this.#selected.clear();
      } else {
        this.#selected = new Set(this.processedItems.map((v) => v.id));
      }
      selector.selected = new Set(this.#selected);
    }));
    stack.use(subscribe("preview-cursor-move", (data) => {
      preview.moveCursor(denops, data, { signal: options.signal });
    }));

    // Update UI in background
    stack.use(startAsyncScheduler(
      async () => {
        const isUpdated = any([
          await prompt.render(denops, { signal }),
          await selector.render(denops, { signal }),
        ]);
        preview.render(denops, { signal })
          .then((isUpdated) => {
            if (isUpdated) {
              return denops.cmd(`redraw | echo ''`);
            }
          })
          .catch((err) => {
            console.warn(`[fall] Failed to render preview: ${err}`);
          });
        if (isUpdated) {
          await denops.cmd(`redraw | echo ''`);
        }
      },
      this.#options.updateInterval ?? UPDATE_INTERVAL,
      { signal },
    ));

    // Observe Vim's prompt
    stack.use(observePrompt(denops, { signal }));

    // Wait for user input
    try {
      await emitPickerEnter(denops, `source:${name}`);
      return await startPrompt(denops, this.#query, { signal });
    } finally {
      await emitPickerLeave(denops, `source:${name}`);
    }
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
const PREVIEW_WIDTH_RATION = 0.45;
const PREVIEW_WIDTH_MIN = 40;
const PREVIEW_WIDTH_MAX = 200;
const UPDATE_INTERVAL = 20;
const PREVIEW_DEBOUNCE_WAIT = 100;
const SOURCE_ITEM_CHUNK_SIZE = 100;
