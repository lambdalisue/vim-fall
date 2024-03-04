import type { Denops } from "https://deno.land/x/denops_std@v6.3.0/mod.ts";
import {
  is,
  type PredicateType,
} from "https://deno.land/x/unknownutil@v3.16.3/mod.ts";

import type {
  Filter,
  PickerItem,
  PresentationItem,
  Previewer,
  Processor,
  Source,
  SourceItem,
} from "../types.ts";
import { AsyncScheduler } from "../util/async_scheduler.ts";
import {
  buildLayout,
  isLayoutParams,
  LayoutParams,
} from "./layout/prompt_top_preview_right.ts";
import { PromptComponent } from "./component/prompt.ts";
import { SelectorComponent } from "./component/selector.ts";
import { PreviewComponent } from "./component/preview.ts";
import {
  applyFiltersAndSorterAndPresenters,
  emitPickerEnter,
  emitPickerLeave,
  isDefined,
} from "./util.ts";

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

export const isItemsPickerParams = is.PartialOf(isLayoutParams);
export type ItemsPickerParams = PredicateType<typeof isItemsPickerParams>;

export interface StartOptions {
  signal?: AbortSignal;
}

export interface StartResult {
  selectedItems?: PresentationItem[];
  dispose: (denops: Denops) => Promise<void>;
}

export class ItemsPicker {
  #source: Source;
  #filters: Filter[];
  #sorters: Processor[];
  #presenters: Processor[];
  #previewer: Previewer;
  #params: LayoutParams;

  #changed: boolean = false;
  #sorterIndex: number = 0;

  constructor(
    source: Source,
    filters: Filter[],
    sorters: Processor[],
    presenters: Processor[],
    previewer: Previewer,
    params: ItemsPickerParams,
  ) {
    this.#source = source;
    this.#filters = filters;
    this.#sorters = sorters;
    this.#presenters = presenters;
    this.#previewer = previewer;
    this.#params = {
      width: params.width,
      widthRatio: params.widthRatio ?? WIDTH_RATION,
      widthMin: params.widthMin ?? WIDTH_MIN,
      widthMax: params.widthMax ?? WIDTH_MAX,
      height: params.height,
      heightRatio: params.heightRatio ?? HEIGHT_RATION,
      heightMin: params.heightMin ?? HEIGHT_MIN,
      heightMax: params.heightMax ?? HEIGHT_MAX,
      previewWidth: params.previewWidth,
      previewWidthRatio: params.previewWidthRatio ?? PREVIEW_WIDTH_RATION,
      previewWidthMin: params.previewWidthMin ?? PREVIEW_WIDTH_MIN,
      previewWidthMax: params.previewWidthMax ?? PREVIEW_WIDTH_MAX,
      border: params.border,
      zindex: params.zindex ?? 50,
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
    args: string[],
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
      try {
        controller.abort();
      } catch {
        // Fail silently
      }
    });

    // Build layout and component
    const layout = await buildLayout(denops, this.#params);
    const prompt = new PromptComponent(
      layout.prompt.bufnr,
      layout.prompt.winid,
    );
    const selector = new SelectorComponent(
      layout.selector.bufnr,
      layout.selector.winid,
      { selectable: true },
    );
    const preview = new PreviewComponent(
      layout.preview.bufnr,
      layout.preview.winid,
      { debounceWait: PREVIEW_DEBOUNCE_WAIT },
    );

    // Read streams and collect items in background
    const pickerItems: PickerItem[] = [];
    let items: PresentationItem[] = [];
    let updateCounter = 0;
    let stream: ReadableStream<SourceItem>;
    try {
      stream = await this.#source(denops, ...args);
    } catch (err) {
      await layout.dispose(denops);
      throw err;
    }
    stream.pipeTo(
      new WritableStream({
        write: (chunk, controller) => {
          pickerItems.push({
            ...chunk,
            id: pickerItems.length.toString(),
          });
          updateCounter += 1;
          if (updateCounter > 200) {
            this.#changed = true;
            updateCounter = 0;
          }
          if (pickerItems.length > 10000) {
            controller.error(new Error("Too many items"));
          }
        },
        close: () => {
          this.#changed = true;
          updateCounter = 0;
        },
      }),
      { signal },
    ).catch((err) => {
      console.warn(`[fall] Error in reading source: ${err}`);
    }).finally(() => {
      this.#changed = true;
      updateCounter = 0;
    });

    // Listen cursor movement events
    const eventSelect = () => {
      const item = items.at(selector.index + selector.offset);
      if (!item) return;
      if (selector.selected.includes(item.id)) {
        selector.selected = selector.selected.filter((v) => v !== item.id);
      } else {
        selector.selected.push(item.id);
      }
    };
    const eventSorterNext = () => this.sorterIndex += 1;
    const eventSorterPrevious = () => this.sorterIndex -= 1;
    const eventCursorNext = () => selector.index += 1;
    const eventCursorPrevious = () => selector.index -= 1;
    const eventPreviewNext = () => {
      preview.line += 1;
      preview.forceImmediateUpdate();
    };
    const eventPreviewPrevious = () => {
      preview.line -= 1;
      preview.forceImmediateUpdate();
    };
    addEventListener("fall:select", eventSelect);
    addEventListener("fall:sorter-next", eventSorterNext);
    addEventListener("fall:sorter-previous", eventSorterPrevious);
    addEventListener("fall:cursor-next", eventCursorNext);
    addEventListener("fall:cursor-previous", eventCursorPrevious);
    addEventListener("fall:preview-next", eventPreviewNext);
    addEventListener("fall:preview-previous", eventPreviewPrevious);
    using _removeEventListener = {
      [Symbol.dispose]: () => {
        removeEventListener("fall:select", eventSelect);
        removeEventListener("fall:sorter-next", eventSorterNext);
        removeEventListener("fall:sorter-previous", eventSorterPrevious);
        removeEventListener("fall:cursor-next", eventCursorNext);
        removeEventListener("fall:cursor-previous", eventCursorPrevious);
        removeEventListener("fall:preview-next", eventPreviewNext);
        removeEventListener("fall:preview-previous", eventPreviewPrevious);
      },
    };

    // Update in background
    using updater = new AsyncScheduler(async () => {
      if (await prompt.render(denops, { signal }) || this.#changed) {
        this.#changed = true;
        items = await applyFiltersAndSorterAndPresenters(
          denops,
          pickerItems,
          prompt.cmdline,
          this.#filters,
          this.#sorter,
          this.#presenters,
          { signal },
        );
        selector.candidates = items.map((v) => ({
          id: v.id,
          value: v.label ?? v.value,
          decorations: v.decorations?.map((v) => ({
            highlight: "FallPickerMatch",
            ...v,
          })),
        }));
      }
      if (await selector.render(denops, { signal })) {
        this.#changed = true;
        const item = items.at(selector.index);
        if (item) {
          const previewItem = await this.#previewer(denops, item, {
            signal,
          });
          preview.path = previewItem?.path;
          preview.line = previewItem?.line ?? 1;
        }
      }
      if (await preview.render(denops, { signal })) {
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
      await emitPickerEnter(denops, "items");
      cancelled = await prompt.start(denops, { signal });
    } catch (e) {
      await layout.dispose(denops);
      throw e;
    } finally {
      await emitPickerLeave(denops, "items");
    }

    const dispose = async (denops: Denops) => {
      await layout.dispose(denops);
    };
    if (cancelled) {
      return { dispose };
    }
    if (selector.selected.length === 0) {
      const selectedItems = [items.at(selector.index)].filter(isDefined);
      return { selectedItems, dispose };
    } else {
      const itemMap = new Map(items.map((v) => [v.id, v]));
      const selectedItems = selector.selected
        .map((v) => itemMap.get(v))
        .filter(isDefined);
      return { selectedItems, dispose };
    }
  }
}
