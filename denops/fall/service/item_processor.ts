import type { Item, Projector } from "../extension/mod.ts";
import { dispatch } from "../util/event.ts";

/**
 * Item processor that processes the given items and stores in the `items` attribute.
 */
export class ItemProcessor implements Disposable {
  readonly #projectors: readonly Projector[];

  #controller = new AbortController();
  #processing = false;
  #items: readonly Item[] = [];

  constructor(
    { projectors }: {
      readonly projectors: readonly Projector[];
    },
  ) {
    this.#projectors = projectors;
  }

  get processing(): boolean {
    return this.#processing;
  }

  get items(): readonly Item[] {
    return this.#items;
  }

  /**
   * Start processing items with the given query.
   *
   * It dispatch the following events:
   *
   * - `item-processor-succeeded`: When processing items is succeeded.
   * - `item-processor-failed`: When processing items is failed.
   * - `item-processor-completed`: When processing items is succeeded or failed.
   *
   * Note that when case of aborting, `item-processor-failed` is not dispatched.
   * To check if the processing is completed, you should use `item-processor-completed`.
   */
  async start(
    { items, query }: {
      readonly items: readonly Item[];
      readonly query: string;
    },
    options: {
      readonly signal: AbortSignal;
    },
  ): Promise<void> {
    this.#abort(); // Cancel previous process
    const signal = AbortSignal.any([
      this.#controller.signal,
      options.signal,
    ]);
    this.#processing = true;
    try {
      let projectedItems: readonly Item[] = items;
      for (const projector of this.#projectors) {
        projectedItems = await projector.project({
          query,
          items: projectedItems,
        }, {
          signal,
        });
        signal.throwIfAborted();
      }
      this.#processing = false;
      this.#items = projectedItems;
      dispatch("item-processor-succeeded", undefined);
    } catch (err) {
      this.#processing = false;
      if (err instanceof DOMException && err.name === "AbortError") return;
      dispatch("item-processor-failed", undefined);
      const m = err.message ?? err;
      console.warn(
        `[fall] Failed to process items with the query '${query}': ${m}`,
      );
    } finally {
      dispatch("item-processor-completed", undefined);
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
