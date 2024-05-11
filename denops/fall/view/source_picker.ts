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
  Source,
  Transformer,
} from "https://deno.land/x/fall_core@v0.11.0/mod.ts";
import { is, type Predicate } from "jsr:@core/unknownutil@3.18.0";

import { any, isDefined } from "../util/collection.ts";
import { startAsyncScheduler } from "../util/async_scheduler.ts";
import { subscribe } from "../util/event.ts";
import {
  buildLayout,
  isLayoutParams,
  Layout,
  LayoutParams,
} from "./layout/picker_layout.ts";
import { PromptComponent } from "./component/prompt.ts";
import { SelectorComponent } from "./component/selector.ts";
import { PreviewComponent } from "./component/preview.ts";
import { emitPickerEnter, emitPickerLeave } from "./util/emitter.ts";
import { observePrompt, startPrompt } from "./util/prompt.ts";
import { ItemCollector } from "./util/item_collector.ts";
import { ItemProcessor } from "./util/item_processor.ts";

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

export const isSourcePickerOptions = is.PartialOf(is.ObjectOf({
  layout: is.PartialOf(isLayoutParams),
  itemCollector: is.PartialOf(is.ObjectOf({
    chunkSize: is.Number,
  })),
  prompt: is.PartialOf(is.ObjectOf({
    spinner: is.ArrayOf(is.String),
    headSymbol: is.String,
    failSymbol: is.String,
  })),
  preview: is.PartialOf(is.ObjectOf({
    debounceWait: is.Number,
  })),
  updateInterval: is.Number,
})) satisfies Predicate<SourcePickerOptions>;

export class SourcePicker implements AsyncDisposable {
  #query = "";
  #index = 0;
  #selected: Set<unknown> = new Set();

  #renderers: Renderer[];
  #previewers: Previewer[];
  #options: SourcePickerOptions;
  #layout: Layout;
  #itemCollector: ItemCollector;
  #itemProcessor: ItemProcessor;
  #disposable: AsyncDisposableStack;

  private constructor(
    renderers: Renderer[],
    previewers: Previewer[],
    options: SourcePickerOptions,
    layout: Layout,
    itemCollector: ItemCollector,
    itemProcessor: ItemProcessor,
    disposable: AsyncDisposableStack,
  ) {
    this.#renderers = renderers;
    this.#previewers = previewers;
    this.#options = options;
    this.#layout = layout;
    this.#itemCollector = itemCollector;
    this.#itemProcessor = itemProcessor;
    this.#disposable = disposable;
  }

  static async create(
    denops: Denops,
    cmdline: string,
    title: string,
    source: Source,
    filters: Transformer[],
    sorters: Projector[],
    renderers: Renderer[],
    previewers: Previewer[],
    pickerOptions: SourcePickerOptions,
  ): Promise<SourcePicker | undefined> {
    const stack = new AsyncDisposableStack();
    const sourceStream = await source.stream({ cmdline });
    if (!sourceStream) {
      // Canceled by source
      return;
    }

    // Start collecting source items
    const itemCollector = stack.use(
      new ItemCollector(sourceStream, {
        chunkSize: pickerOptions.itemCollector?.chunkSize ??
          SOURCE_ITEM_CHUNK_SIZE,
      }),
    );
    itemCollector.start();

    const itemProcessor = stack.use(new ItemProcessor(filters, sorters));

    // Build layout
    const layout = stack.use(
      await buildLayout(denops, {
        title,
        width: pickerOptions.layout?.width,
        widthRatio: pickerOptions.layout?.widthRatio ?? WIDTH_RATION,
        widthMin: pickerOptions.layout?.widthMin ?? WIDTH_MIN,
        widthMax: pickerOptions.layout?.widthMax ?? WIDTH_MAX,
        height: pickerOptions.layout?.height,
        heightRatio: pickerOptions.layout?.heightRatio ?? HEIGHT_RATION,
        heightMin: pickerOptions.layout?.heightMin ?? HEIGHT_MIN,
        heightMax: pickerOptions.layout?.heightMax ?? HEIGHT_MAX,
        previewRatio: pickerOptions.layout?.previewRatio ?? PREVIEW_RATION,
        border: pickerOptions.layout?.border,
        divider: pickerOptions.layout?.divider,
        zindex: pickerOptions.layout?.zindex ?? 50,
      }),
    );

    return new SourcePicker(
      renderers,
      previewers,
      pickerOptions,
      layout,
      itemCollector,
      itemProcessor,
      stack.move(),
    );
  }

  get collectedItems(): Item[] {
    return this.#itemCollector.items;
  }

  get availableItems(): Item[] {
    return this.#itemProcessor.items;
  }

  get selectedItems(): Item[] {
    const m = new Map(this.availableItems.map((v) => [v.id, v]));
    return [...this.#selected].map((v) => m.get(v)).filter(isDefined);
  }

  get cursorItem(): Item | undefined {
    return this.availableItems.at(this.#index);
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
    const [scrolloff, promptWinwidth, selectorWinwidth, selectorWinheight] =
      await collect(
        denops,
        (denops) => [
          opt.scrolloff.get(denops),
          fn.winwidth(denops, this.#layout.prompt.winid),
          fn.winwidth(denops, this.#layout.selector.winid),
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
        winwidth: selectorWinwidth,
        winheight: selectorWinheight,
        renderers: this.#renderers,
      },
    );
    const preview = new PreviewComponent(
      this.#layout.preview.bufnr,
      this.#layout.preview.winid,
      {
        previewers: this.#previewers,
        debounceWait: this.#options.preview?.debounceWait ??
          PREVIEW_DEBOUNCE_WAIT,
      },
    );

    // Subscribe custom events
    stack.use(subscribe("item-collector-changed", () => {
      prompt.collecting = true;
      prompt.counter = {
        processed: this.availableItems.length,
        collected: this.collectedItems.length,
      };
      prompt.processing = true;
      this.#itemProcessor.start(this.collectedItems, this.#query);
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
        processed: this.availableItems.length,
        collected: this.collectedItems.length,
      };
      selector.items = this.availableItems;
      selector.index = this.#index;
      preview.item = this.cursorItem;
    }));
    stack.use(subscribe("item-processor-failed", () => {
      prompt.processing = "failed";
    }));
    stack.use(subscribe("cmdline-changed", (cmdline) => {
      this.#query = cmdline;
      this.#itemProcessor.start(this.collectedItems, this.#query);
      prompt.cmdline = this.#query;
    }));
    stack.use(subscribe("cmdpos-changed", (cmdpos) => {
      prompt.cmdpos = cmdpos;
    }));
    stack.use(subscribe("selector-cursor-move", (offset) => {
      const nextIndex = Math.max(
        0,
        Math.min(this.availableItems.length - 1, this.#index + offset),
      );
      this.#index = nextIndex;
      selector.index = this.#index;
    }));
    stack.use(subscribe("selector-cursor-move-at", (line) => {
      if (line === "$") {
        this.#index = this.availableItems.length - 1;
      } else {
        this.#index = Math.max(
          0,
          Math.min(this.availableItems.length - 1, line - 1),
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
      if (this.#selected.size === this.availableItems.length) {
        this.#selected.clear();
      } else {
        this.#selected = new Set(this.availableItems.map((v) => v.id));
      }
      selector.selected = new Set(this.#selected);
    }));
    stack.use(subscribe("preview-cursor-move", (offset) => {
      preview.moveCursor(denops, offset, { signal: options.signal });
    }));
    stack.use(subscribe("preview-cursor-move-at", (line) => {
      preview.moveCursorAt(denops, line, { signal: options.signal });
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
const PREVIEW_RATION = 0.45;
const UPDATE_INTERVAL = 20;
const PREVIEW_DEBOUNCE_WAIT = 100;
const SOURCE_ITEM_CHUNK_SIZE = 100;
