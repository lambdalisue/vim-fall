import type { Item, Renderer, RendererItem } from "../extension/mod.ts";
import { dispatch } from "../util/event.ts";

export type Params = {
  readonly renderers: readonly Renderer[];
};

export class ItemRenderer implements Disposable {
  readonly #renderers: readonly Renderer[];

  #controller = new AbortController();
  #processing = false;
  #items: readonly RendererItem[] = [];
  #offset: number = 0;

  constructor(params: Params) {
    this.#renderers = params.renderers;
  }

  get processing(): boolean {
    return this.#processing;
  }

  get items(): readonly RendererItem[] {
    return this.#items;
  }

  get offset(): number {
    return this.#offset;
  }

  async start(
    { items, index, width, height, scrolloff }: {
      readonly items: readonly Item[];
      readonly index: number;
      readonly width: number;
      readonly height: number;
      readonly scrolloff: number;
    },
    options: { signal: AbortSignal },
  ): Promise<void> {
    this.#abort(); // Cancel previous process
    const signal = AbortSignal.any([
      this.#controller.signal,
      options.signal,
    ]);
    this.#processing = true;
    try {
      this.#offset = calcScrollOffset(
        this.#offset,
        index,
        items.length,
        height,
        scrolloff,
      );
      const visibleItems = items.slice(
        this.#offset,
        this.#offset + height,
      );

      const rendererItems = await applyRenderers(
        visibleItems,
        this.#renderers,
        { width },
        { signal },
      );
      this.#processing = false;
      this.#items = rendererItems;
      dispatch("item-renderer-succeeded", undefined);
    } catch (err) {
      this.#processing = false;
      if (err instanceof DOMException && err.name === "AbortError") return;
      dispatch("item-renderer-failed", undefined);
      const m = err.message ?? err;
      console.warn(
        `[fall] Failed to format items with the index/offset '${index}/${this.#offset}': ${m}`,
      );
    } finally {
      dispatch("item-renderer-completed", undefined);
    }
  }

  #abort(): void {
    try {
      this.#controller.abort();
    } catch {
      // Fail silently
    }
    this.#controller = new AbortController();
  }

  [Symbol.dispose]() {
    this.#abort();
  }
}

async function applyRenderers(
  items: readonly RendererItem[],
  renderers: readonly Renderer[],
  params: { width: number },
  { signal }: { signal: AbortSignal },
): Promise<readonly RendererItem[]> {
  const size = items.length;
  if (size === 0) return [];
  for (const renderer of renderers) {
    const newItems = await renderer.render({ items, ...params }, { signal });
    signal.throwIfAborted();

    if (newItems.length !== size) {
      console.warn(
        `[fall] Renderer ${renderer.name} returned different size of items. Ignore.`,
      );
      continue;
    }
    items = newItems;
  }
  return items;
}

/**
 * Calculate scroll offset
 *
 * From 0 to 9, window size is 5, and scrolloff is 2.
 * ```
 * ┌v────────┐
 * │0 1 2 3 4│5 6 7 8 9
 * └^────────┘
 * ┌──v──────┐
 * │0 1 2 3 4│5 6 7 8 9
 * └──^──────┘
 * ┌────v────┐
 * │0 1 2 3 4│5 6 7 8 9
 * └────^────┘
 * ┌──────v──┐
 * │0 1 2 3 4│5 6 7 8 9
 * └──────^──┘
 *   ┌──────v──┐
 *  0│1 2 3 4 5│6 7 8 9
 *   └──────^──┘
 *     ┌──────v──┐
 *  0 1│2 3 4 5 6│7 8 9
 *     └──────^──┘
 *       ┌──────v──┐
 *  0 1 2│3 4 5 6 7│8 9
 *       └──────^──┘
 *         ┌──────v──┐
 *  0 1 2 3│4 5 6 7 8│9
 *         └──────^──┘
 *           ┌──────v──┐
 *  0 1 2 3 4│5 6 7 8 9│
 *           └──────^──┘
 *           ┌────────v┐
 *  0 1 2 3 4│5 6 7 8 9│
 *           └────────^┘
 * ```
 *
 * From 9 to 0, window size is 5, and scrolloff is 2.
 * ```
 *           ┌────────v┐
 *  0 1 2 3 4│5 6 7 8 9│
 *           └────────^┘
 *           ┌──────v──┐
 *  0 1 2 3 4│5 6 7 8 9│
 *           └──────^──┘
 *           ┌────v────┐
 *  0 1 2 3 4│5 6 7 8 9│
 *           └────^────┘
 *           ┌──v──────┐
 *  0 1 2 3 4│5 6 7 8 9│
 *           └──^──────┘
 *         ┌──v──────┐
 *  0 1 2 3│4 5 6 7 8│9
 *         └──^──────┘
 *       ┌──v──────┐
 *  0 1 2│3 4 5 6 7│8 9
 *       └──^──────┘
 *     ┌──v──────┐
 *  0 1│2 3 4 5 6│7 8 9
 *     └──^──────┘
 *   ┌──v──────┐
 *  0│1 2 3 4 5│6 7 8 9
 *   └──^──────┘
 * ┌──v──────┐
 * │0 1 2 3 4│5 6 7 8 9
 * └──^──────┘
 * ┌v────────┐
 * │0 1 2 3 4│5 6 7 8 9
 * └^────────┘
 * ```
 */
function calcScrollOffset(
  offset: number,
  index: number,
  count: number,
  window: number,
  scrolloff: number,
): number {
  const windowOffset = index - offset;
  const maxWindowOffset = window - scrolloff;
  const minWindowOffset = scrolloff;
  if (count < window) {
    return 0;
  } else if (windowOffset > maxWindowOffset) {
    return Math.min(count - window, index - maxWindowOffset);
  } else if (windowOffset < minWindowOffset) {
    return Math.max(0, index - minWindowOffset + 1);
  }
  return offset;
}

export const _internal = {
  applyRenderers,
  calcScrollOffset,
};
