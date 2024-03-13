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
  Renderer,
  Sorter,
} from "https://deno.land/x/fall_core@v0.5.1/mod.ts";

import { any } from "../../util/collection.ts";
import { startAsyncScheduler } from "../../util/async_scheduler.ts";
import { subscribe } from "../../util/event.ts";
import { buildLayout, Layout, LayoutParams } from "../layout/prompt_top.ts";
import { PromptComponent } from "../component/prompt.ts";
import { SelectorComponent } from "../component/selector.ts";
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
  updateInterval?: number;
}

export class ActionPicker implements AsyncDisposable {
  #query = "";
  #index = 0;

  #actions: Map<string, Action>;
  #renderers: Map<string, Renderer>;
  #options: ActionPickerOptions;
  #layout: Layout;
  #itemProcessor: ItemProcessor;
  #disposable: AsyncDisposableStack;

  private constructor(
    actions: Map<string, Action>,
    renderers: Map<string, Renderer>,
    options: ActionPickerOptions,
    layout: Layout,
    itemProcessor: ItemProcessor,
    disposable: AsyncDisposableStack,
  ) {
    this.#actions = actions;
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
    renderers: Map<string, Renderer>,
    sorters: Map<string, Sorter>,
    options: ActionPickerOptions,
  ): Promise<ActionPicker> {
    const stack = new AsyncDisposableStack();

    const itemProcessor = stack.use(new ItemProcessor(filters, sorters));

    // Build layout
    const title = [
      itemProcessor.currentFilterName,
      itemProcessor.currentSorterName,
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
        border: options.layout?.border,
        zindex: options.layout?.zindex ?? 51,
      }),
    );

    return new ActionPicker(
      actions,
      renderers,
      options,
      layout,
      itemProcessor,
      stack.move(),
    );
  }

  get #title(): string {
    return [
      this.#itemProcessor.currentFilterName,
      this.#itemProcessor.currentSorterName,
    ].join(" / ");
  }

  get collectedItems(): Item[] {
    return [...this.#actions.keys()].map((v) => ({
      id: v,
      value: v,
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
        null,
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

    // Subscribe custom events
    stack.use(subscribe("item-processor-succeeded", () => {
      prompt.processing = false;
      prompt.counter = {
        processed: this.processedItems.length,
        collected: this.collectedItems.length,
      };
      selector.items = this.processedItems;
      selector.index = this.#index;
    }));
    stack.use(subscribe("item-processor-failed", () => {
      prompt.processing = "failed";
    }));
    stack.use(subscribe("item-processor-filter-prev", () => {
      this.#itemProcessor.currentFilterIndex -= 1;
      popup.config(denops, this.#layout.prompt.winid, {
        title: ` ${this.#title} `,
      }).catch((err) => {
        console.warn(`[fall] Failed to set popup config: ${err}`);
      });
    }));
    stack.use(subscribe("item-processor-filter-next", () => {
      this.#itemProcessor.currentFilterIndex += 1;
      popup.config(denops, this.#layout.prompt.winid, {
        title: ` ${this.#title} `,
      }).catch((err) => {
        console.warn(`[fall] Failed to set popup config: ${err}`);
      });
    }));
    stack.use(subscribe("item-processor-sorter-prev", () => {
      this.#itemProcessor.currentSorterIndex -= 1;
      popup.config(denops, this.#layout.prompt.winid, {
        title: ` ${this.#title} `,
      }).catch((err) => {
        console.warn(`[fall] Failed to set popup config: ${err}`);
      });
    }));
    stack.use(subscribe("item-processor-sorter-next", () => {
      this.#itemProcessor.currentSorterIndex += 1;
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
      this.#index += offset;
      selector.index = this.#index;
    }));
    stack.use(subscribe("selector-cursor-move-at", (line) => {
      if (line === "$") {
        this.#index = this.processedItems.length - 1;
      } else {
        this.#index = line;
      }
      selector.index = this.#index;
    }));

    // Update UI in background
    stack.use(startAsyncScheduler(
      async () => {
        const isUpdated = any([
          await prompt.render(denops, { signal }),
          await selector.render(denops, { signal }),
        ]);
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

const UPDATE_INTERVAL = 20;
