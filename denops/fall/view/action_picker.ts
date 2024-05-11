import type { Denops } from "https://deno.land/x/denops_std@v6.4.0/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v6.4.0/function/mod.ts";
import * as opt from "https://deno.land/x/denops_std@v6.4.0/option/mod.ts";
import { g } from "https://deno.land/x/denops_std@v6.4.0/variable/mod.ts";
import {
  batch,
  collect,
} from "https://deno.land/x/denops_std@v6.4.0/batch/mod.ts";
import type {
  Action,
  Item,
  Previewer,
  Projector,
  Renderer,
  Transformer,
} from "https://deno.land/x/fall_core@v0.11.0/mod.ts";
import { is, type Predicate } from "jsr:@core/unknownutil@3.18.0";

import { any } from "../util/collection.ts";
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
import { emitPickerEnter, emitPickerLeave } from "./util/emitter.ts";
import { observePrompt, startPrompt } from "./util/prompt.ts";
import { ItemProcessor } from "./util/item_processor.ts";

export interface ActionPickerOptions {
  layout?: Partial<LayoutParams>;
  query?: {
    spinner?: string[];
    headSymbol?: string;
    failSymbol?: string;
  };
  preview?: {
    debounceWait?: number;
  };
  updateInterval?: number;
}

export const isActionPickerOptions = is.PartialOf(is.ObjectOf({
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
})) satisfies Predicate<ActionPickerOptions>;

export class ActionPicker implements AsyncDisposable {
  #query = "";
  #index = 0;

  #actions: Map<string, Action>;
  #renderers: Renderer[];
  #previewers: Previewer[];
  #options: ActionPickerOptions;
  #layout: Layout;
  #itemProcessor: ItemProcessor;
  #disposable: AsyncDisposableStack;

  private constructor(
    actions: Map<string, Action>,
    renderers: Renderer[],
    previewers: Previewer[],
    options: ActionPickerOptions,
    layout: Layout,
    itemProcessor: ItemProcessor,
    disposable: AsyncDisposableStack,
  ) {
    this.#actions = actions;
    this.#renderers = renderers;
    this.#previewers = previewers;
    this.#options = options;
    this.#layout = layout;
    this.#itemProcessor = itemProcessor;
    this.#disposable = disposable;
  }

  static async create(
    denops: Denops,
    actions: Map<string, Action>,
    filters: Transformer[],
    sorters: Projector[],
    renderers: Renderer[],
    previewers: Previewer[],
    options: ActionPickerOptions,
  ): Promise<ActionPicker> {
    const stack = new AsyncDisposableStack();

    const itemProcessor = stack.use(new ItemProcessor(filters, sorters));

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
        previewRatio: options.layout?.previewRatio ?? PREVIEW_RATION,
        border: options.layout?.border,
        divider: options.layout?.divider,
        zindex: options.layout?.zindex ?? 51,
      }),
    );

    return new ActionPicker(
      actions,
      renderers,
      previewers,
      options,
      layout,
      itemProcessor,
      stack.move(),
    );
  }

  get collectedItems(): Item[] {
    return [...this.#actions.entries()].map(([k, v]) => ({
      id: k,
      value: k,
      detail: {
        content: v.description,
      },
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
        "_fall_layout_query_winid",
        this.#layout.query.winid,
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
    const [scrolloff, queryWinwidth, selectorWinwidth, selectorWinheight] =
      await collect(
        denops,
        (denops) => [
          opt.scrolloff.get(denops),
          fn.winwidth(denops, this.#layout.query.winid),
          fn.winwidth(denops, this.#layout.selector.winid),
          fn.winheight(denops, this.#layout.selector.winid),
        ],
      );

    // Bind components to the layout
    const query = new QueryComponent(
      this.#layout.query.bufnr,
      this.#layout.query.winid,
      {
        winwidth: queryWinwidth,
        headSymbol: this.#options.query?.headSymbol,
        failSymbol: this.#options.query?.failSymbol,
        spinner: this.#options.query?.spinner,
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
    stack.use(subscribe("item-processor-succeeded", () => {
      query.processing = false;
      query.counter = {
        processed: this.processedItems.length,
        collected: this.collectedItems.length,
      };
      selector.items = this.processedItems;
      selector.index = this.#index;
      preview.item = this.cursorItem;
    }));
    stack.use(subscribe("item-processor-failed", () => {
      query.processing = "failed";
    }));
    stack.use(subscribe("cmdline-changed", (cmdline) => {
      this.#query = cmdline;
      this.#itemProcessor.start(this.collectedItems, this.#query);
      query.cmdline = this.#query;
    }));
    stack.use(subscribe("cmdpos-changed", (cmdpos) => {
      query.cmdpos = cmdpos;
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
