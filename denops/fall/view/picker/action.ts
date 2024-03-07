import type { Denops } from "https://deno.land/x/denops_std@v6.3.0/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v6.3.0/function/mod.ts";
import * as opt from "https://deno.land/x/denops_std@v6.3.0/option/mod.ts";
import { collect } from "https://deno.land/x/denops_std@v6.3.0/batch/mod.ts";
import type {
  Action,
  Processor,
  ProcessorItem,
  Renderer,
} from "https://deno.land/x/fall_core@v0.3.0/mod.ts";

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
    processors: Map<string, Processor>,
    renderers: Map<string, Renderer>,
    options: ActionPickerOptions,
  ): Promise<ActionPicker> {
    const stack = new AsyncDisposableStack();

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
        border: options.layout?.border,
        zindex: options.layout?.zindex ?? 51,
      }),
    );

    const itemProcessor = stack.use(new ItemProcessor(processors));

    return new ActionPicker(
      actions,
      renderers,
      options,
      layout,
      itemProcessor,
      stack.move(),
    );
  }

  get collectedItems(): ProcessorItem[] {
    return [...this.#actions.keys()].map((v) => ({
      id: v,
      value: v,
      decorations: [],
    }));
  }

  get processedItems(): ProcessorItem[] {
    return this.#itemProcessor.items;
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
    stack.use(subscribe("cmdline-changed", (data) => {
      this.#query = data;
      this.#itemProcessor.start(denops, this.collectedItems, this.#query);
      prompt.cmdline = this.#query;
    }));
    stack.use(subscribe("cmdpos-changed", (data) => {
      prompt.cmdpos = data;
    }));
    stack.use(subscribe("selector-cursor-move", (data) => {
      this.#index += data;
      selector.index = this.#index;
    }));
    stack.use(subscribe("selector-cursor-move-at", (data) => {
      if (data === "$") {
        this.#index = this.processedItems.length - 1;
      } else {
        this.#index = data;
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
