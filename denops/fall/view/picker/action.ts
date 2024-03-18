import type { Denops } from "https://deno.land/x/denops_std@v6.4.0/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v6.4.0/function/mod.ts";
import * as opt from "https://deno.land/x/denops_std@v6.4.0/option/mod.ts";
import { g } from "https://deno.land/x/denops_std@v6.4.0/variable/mod.ts";
import {
  batch,
  collect,
} from "https://deno.land/x/denops_std@v6.4.0/batch/mod.ts";
import * as popup from "https://deno.land/x/denops_std@v6.4.0/popup/mod.ts";
import type {
  Action,
  Filter,
  Item,
  Previewer,
  Renderer,
  Sorter,
} from "https://deno.land/x/fall_core@v0.5.1/mod.ts";

import { any } from "../../util/collection.ts";
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
import { ItemProcessor } from "../util/item_processor.ts";

export interface ActionPickerOptions {
  layout?: Partial<LayoutParams>;
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

export class ActionPicker implements AsyncDisposable {
  #query = "";
  #index = 0;

  #actions: Map<string, Action>;
  #previewer: Previewer | undefined;
  #renderers: Map<string, Renderer>;
  #options: ActionPickerOptions;
  #layout: Layout;
  #itemProcessor: ItemProcessor;
  #disposable: AsyncDisposableStack;

  private constructor(
    actions: Map<string, Action>,
    previewer: Previewer | undefined,
    renderers: Map<string, Renderer>,
    options: ActionPickerOptions,
    layout: Layout,
    itemProcessor: ItemProcessor,
    disposable: AsyncDisposableStack,
  ) {
    this.#actions = actions;
    this.#previewer = previewer;
    this.#renderers = renderers;
    this.#options = options;
    this.#layout = layout;
    this.#itemProcessor = itemProcessor;
    this.#disposable = disposable;
  }

  static async create(
    denops: Denops,
    actions: Map<string, Action>,
    filters: Map<string, Filter>,
    previewer: Previewer | undefined,
    renderers: Map<string, Renderer>,
    sorters: Map<string, Sorter>,
    options: ActionPickerOptions,
  ): Promise<ActionPicker> {
    const stack = new AsyncDisposableStack();

    const itemProcessor = stack.use(new ItemProcessor(filters, sorters));

    // Build layout
    const title = [
      itemProcessor.filterName,
      itemProcessor.sorterName,
    ].join(" / ");
    const layout = stack.use(
      await buildLayout(denops, {
        title: ` ${title} `,
        width: options.layout?.width,
        widthRatio: options.layout?.widthRatio ?? WIDTH_RATION,
        widthMin: options.layout?.widthMin ?? WIDTH_MIN,
        widthMax: options.layout?.widthMax ?? WIDTH_MAX,
        height: options.layout?.height,
        heightRatio: options.layout?.heightRatio ?? HEIGHT_RATION,
        heightMin: options.layout?.heightMin ?? HEIGHT_MIN,
        heightMax: options.layout?.heightMax ?? HEIGHT_MAX,
        previewRatio: options.layout?.previewRatio ?? PREVIEW_RATION,
        border: options.layout?.border,
        zindex: options.layout?.zindex ?? 51,
      }),
    );

    return new ActionPicker(
      actions,
      previewer,
      renderers,
      options,
      layout,
      itemProcessor,
      stack.move(),
    );
  }

  get #title(): string {
    return [
      this.#itemProcessor.filterName,
      this.#itemProcessor.sorterName,
    ].join(" / ");
  }

  get collectedItems(): Item[] {
    return [...this.#actions.entries()].map(([k, _v]) => ({
      id: k,
      value: k,
      detail: {},
      decorations: [],
    }));
  }

  get processedItems(): Item[] {
    return this.#itemProcessor.items;
  }

  get cursorItem(): Item | undefined {
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
        headSymbol: this.#options.prompt?.headSymbol,
        failSymbol: this.#options.prompt?.failSymbol,
        spinner: this.#options.prompt?.spinner,
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
        previewer: this.#previewer,
        debounceWait: this.#options.preview?.debounceWait ??
          PREVIEW_DEBOUNCE_WAIT,
      },
    );

    // Subscribe custom events
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
    stack.use(subscribe("item-processor-filter-prev", () => {
      this.#itemProcessor.filterIndex -= 1;
      popup.config(denops, this.#layout.prompt.winid, {
        title: ` ${this.#title} `,
      }).catch((err) => {
        console.warn(`[fall] Failed to set popup config: ${err}`);
      });
    }));
    stack.use(subscribe("item-processor-filter-next", () => {
      this.#itemProcessor.filterIndex += 1;
      popup.config(denops, this.#layout.prompt.winid, {
        title: ` ${this.#title} `,
      }).catch((err) => {
        console.warn(`[fall] Failed to set popup config: ${err}`);
      });
    }));
    stack.use(subscribe("item-processor-sorter-prev", () => {
      this.#itemProcessor.sorterIndex -= 1;
      popup.config(denops, this.#layout.prompt.winid, {
        title: ` ${this.#title} `,
      }).catch((err) => {
        console.warn(`[fall] Failed to set popup config: ${err}`);
      });
    }));
    stack.use(subscribe("item-processor-sorter-next", () => {
      this.#itemProcessor.sorterIndex += 1;
      popup.config(denops, this.#layout.prompt.winid, {
        title: ` ${this.#title} `,
      }).catch((err) => {
        console.warn(`[fall] Failed to set popup config: ${err}`);
      });
    }));
    stack.use(subscribe("cmdline-changed", (cmdline) => {
      this.#query = cmdline;
      this.#itemProcessor.start(denops, this.collectedItems, this.#query);
      prompt.cmdline = this.#query;
    }));
    stack.use(subscribe("cmdpos-changed", (cmdpos) => {
      prompt.cmdpos = cmdpos;
    }));
    stack.use(subscribe("selector-cursor-move", (offset) => {
      const nextIndex = Math.max(
        0,
        Math.min(this.processedItems.length - 1, this.#index + offset),
      );
      this.#index = nextIndex;
      selector.index = this.#index;
    }));
    stack.use(subscribe("selector-cursor-move-at", (line) => {
      if (line === "$") {
        this.#index = this.processedItems.length - 1;
      } else {
        this.#index = Math.max(
          0,
          Math.min(this.processedItems.length - 1, line - 1),
        );
      }
      selector.index = this.#index;
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
      await emitPickerEnter(denops, `action`);
      return await startPrompt(denops, this.#query, { signal });
    } finally {
      await emitPickerLeave(denops, `action`);
    }
  }

  async [Symbol.asyncDispose](): Promise<void> {
    await this.#disposable.disposeAsync();
  }
}

const WIDTH_RATION = 0.6;
const WIDTH_MIN = 70;
const WIDTH_MAX = 300;
const HEIGHT_RATION = 0.8;
const HEIGHT_MIN = 4;
const HEIGHT_MAX = 30;
const PREVIEW_RATION = 0.45;
const UPDATE_INTERVAL = 20;
const PREVIEW_DEBOUNCE_WAIT = 100;
