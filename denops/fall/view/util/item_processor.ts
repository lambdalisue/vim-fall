import type {
  Item,
  Projector,
  Transformer,
} from "https://deno.land/x/fall_core@v0.10.0/mod.ts";

import { dispatch } from "../../util/event.ts";

/**
 * Process items with a filter and a sorter and store them in the internal state.
 */
export class ItemProcessor implements Disposable {
  #controller: AbortController = new AbortController();
  #transformers: Transformer[];
  #projectors: Projector[];

  #items: Item[] = [];

  constructor(filters: Transformer[], sorters: Projector[]) {
    this.#transformers = filters;
    this.#projectors = sorters;
  }

  /**
   * Processed items
   */
  get items(): Item[] {
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
  start(
    items: Item[],
    query: string,
  ): void {
    this.#abort(); // Cancel previous processing

    const { signal } = this.#controller;
    const inner = async () => {
      if (signal.aborted) return;

      let stream = ReadableStream.from(items);
      for (const transformer of this.#transformers) {
        const transform = await transformer.transform({ query }, { signal });
        if (transform) {
          stream = stream.pipeThrough(transform, { signal });
        }
      }

      const transformedItems: Item[] = [];
      await stream.pipeTo(
        new WritableStream({
          write: (chunk) => {
            transformedItems.push(chunk);
          },
        }),
        { signal },
      );
      if (signal.aborted) return;

      let projectedItems = [...transformedItems];
      for (const projector of this.#projectors) {
        projectedItems = await projector.project({
          query,
          items: projectedItems,
        }, {
          signal,
        });
      }
      this.#items = projectedItems;
      dispatch("item-processor-succeeded", undefined);
    };
    inner()
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        console.warn(`[fall] Failed to process items: ${err}`);
        dispatch("item-processor-failed", undefined);
      })
      .finally(() => {
        dispatch("item-processor-completed", undefined);
      });
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
