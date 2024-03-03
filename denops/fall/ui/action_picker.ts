import type { Denops } from "https://deno.land/x/denops_std@v6.3.0/mod.ts";
import {
  is,
  type PredicateType,
} from "https://deno.land/x/unknownutil@v3.16.3/mod.ts";

import type { Action, Filter, PresentationItem, Processor } from "../types.ts";
import { AsyncScheduler } from "../util/async_scheduler.ts";
import {
  buildLayout,
  isLayoutParams,
  LayoutParams,
} from "./layout/prompt_top.ts";
import { PromptComponent } from "./component/prompt.ts";
import { SelectorComponent } from "./component/selector.ts";
import {
  applyFiltersAndSorterAndPresenters,
  emitPickerEnter,
  emitPickerLeave,
} from "./util.ts";

const WIDTH_RATION = 0.6;
const WIDTH_MIN = 70;
const WIDTH_MAX = 300;

const HEIGHT_RATION = 0.8;
const HEIGHT_MIN = 4;
const HEIGHT_MAX = 30;

const UPDATE_INTERVAL = 20;

export const isActionPickerParams = is.PartialOf(isLayoutParams);
export type ActionPickerParams = PredicateType<typeof isActionPickerParams>;

export interface StartOptions {
  signal?: AbortSignal;
}

export interface StartResult {
  selectedAction?: Action;
  dispose: (denops: Denops) => Promise<void>;
}

export class ActionPicker {
  #actions: Map<string, Action>;
  #filters: Filter[];
  #sorters: Processor[];
  #presenters: Processor[];
  #params: LayoutParams;

  #changed: boolean = false;
  #sorterIndex: number = 0;

  constructor(
    actions: Map<string, Action>,
    filters: Filter[],
    sorters: Processor[],
    presenters: Processor[],
    params: ActionPickerParams,
  ) {
    this.#actions = actions;
    this.#filters = filters;
    this.#sorters = sorters;
    this.#presenters = presenters;
    this.#params = {
      width: params.width,
      widthRatio: params.widthRatio ?? WIDTH_RATION,
      widthMin: params.widthMin ?? WIDTH_MIN,
      widthMax: params.widthMax ?? WIDTH_MAX,
      height: params.height,
      heightRatio: params.heightRatio ?? HEIGHT_RATION,
      heightMin: params.heightMin ?? HEIGHT_MIN,
      heightMax: params.heightMax ?? HEIGHT_MAX,
      border: params.border,
      zindex: params.zindex ?? 51,
    };
  }

  get #sorter(): Processor {
    return this.#sorters.at(this.#sorterIndex) ??
      ((_denops, items, _options) => items);
  }

  get sorterIndex(): number {
    return this.#sorterIndex;
  }

  set sorterIndex(index: number) {
    index = index % this.#sorters.length;
    const changed = this.#sorterIndex !== index;
    this.#changed = this.#changed || changed;
    this.#sorterIndex = index;
  }

  async start(
    denops: Denops,
    options: StartOptions = {},
  ): Promise<StartResult> {
    const controller = new AbortController();
    using _controller = {
      [Symbol.dispose]: () => {
        try {
          controller.abort();
        } catch {
          // Fail silently
        }
      },
    };
    const { signal } = controller;
    options.signal?.addEventListener("abort", () => {
      controller.abort();
    });

    const actions = Array.from(this.#actions.keys()).map((v) => ({
      id: v,
      value: v,
    }));

    // Build layout and component
    const layout = await buildLayout(denops, this.#params);
    const prompt = new PromptComponent(
      layout.prompt.bufnr,
      layout.prompt.winid,
    );
    const selector = new SelectorComponent(
      layout.selector.bufnr,
      layout.selector.winid,
      { selectable: false },
    );
    await denops.redraw();

    // Listen cursor movement events
    const eventSorterNext = () => this.sorterIndex += 1;
    const eventSorterPrevious = () => this.sorterIndex -= 1;
    const eventCursorNext = () => selector.index += 1;
    const eventCursorPrevious = () => selector.index -= 1;
    addEventListener("fall:sorter-next", eventSorterNext);
    addEventListener("fall:sorter-previous", eventSorterPrevious);
    addEventListener("fall:cursor-next", eventCursorNext);
    addEventListener("fall:cursor-previous", eventCursorPrevious);
    using _removeEventListener = {
      [Symbol.dispose]: () => {
        removeEventListener("fall:sorter-next", eventSorterNext);
        removeEventListener("fall:sorter-previous", eventSorterPrevious);
        removeEventListener("fall:cursor-next", eventCursorNext);
        removeEventListener("fall:cursor-previous", eventCursorPrevious);
      },
    };

    // Update in background
    let processedItems: PresentationItem[] = [];
    using updater = new AsyncScheduler(async () => {
      if (await prompt.render(denops, { signal }) || this.#changed) {
        this.#changed = true;
        processedItems = await applyFiltersAndSorterAndPresenters(
          denops,
          actions,
          prompt.cmdline,
          this.#filters,
          this.#sorter,
          this.#presenters,
          { signal },
        );
        selector.candidates = processedItems.map((v) => ({
          id: v.id,
          value: v.value,
          decorations: v.decorations?.map((v) => ({
            highlight: "FallPickerMatch",
            ...v,
          })),
        }));
      }
      if (await selector.render(denops, { signal })) {
        this.#changed = true;
      }
      if (this.#changed) {
        await denops.cmd(`redraw | echo '${prompt.header}${prompt.cmdline}'`);
      }
      this.#changed = false;
    }, UPDATE_INTERVAL);
    updater.start({ signal });

    // Wait for user input
    let cancelled = false;
    try {
      await emitPickerEnter(denops, "action");
      cancelled = await prompt.start(denops, { signal });
    } catch (e) {
      await layout.dispose(denops);
      throw e;
    } finally {
      await emitPickerLeave(denops, "action");
    }

    const dispose = async (denops: Denops) => {
      await layout.dispose(denops);
    };
    if (cancelled) {
      return { dispose };
    }
    const selectedAction = this.#actions.get(
      processedItems.at(selector.index)?.id ?? "",
    );
    if (!selectedAction) {
      return { dispose };
    }
    return { selectedAction, dispose };
  }
}
