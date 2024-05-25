import type { Item, Renderer, RendererItem } from "../extension/type.ts";
import { calcScrollOffset } from "../view/util/scrolloffset.ts";
import { dispatch } from "../util/event.ts";

export type Params = {
  readonly renderers: readonly Renderer[];
  readonly scrolloff: number;
};

export class ItemRenderer implements Disposable {
  readonly #renderers: readonly Renderer[];
  readonly #scrolloff: number;

  #controller = new AbortController();
  #processing = false;
  #items: readonly RendererItem[] = [];
  #offset: number = 0;

  constructor(params: Params) {
    this.#renderers = params.renderers;
    this.#scrolloff = params.scrolloff;
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
    { items, index, width, height }: {
      readonly items: readonly Item[];
      readonly index: number;
      readonly width: number;
      readonly height: number;
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
        this.#scrolloff,
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
    try {
      const newItems = await renderer.render({ items, ...params }, { signal });
      signal.throwIfAborted();

      if (newItems.length !== size) {
        console.warn(
          `[fall] Renderer ${renderer.name} returned different size of items. Ignore.`,
        );
        continue;
      }
      items = newItems;
    } catch (err) {
      const m = err.message ?? err;
      console.warn(`[fall] Failed to apply renderer ${renderer.name}: ${m}`);
    }
  }
  return items;
}
