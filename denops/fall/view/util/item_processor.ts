import type { Denops } from "https://deno.land/x/denops_std@v6.4.0/mod.ts";
import type {
  Filter,
  Item,
  Sorter,
} from "https://deno.land/x/fall_core@v0.8.0/mod.ts";

import { dispatch } from "../../util/event.ts";

/**
 * Process items with a filter and a sorter and store them in the internal state.
 */
export class ItemProcessor implements Disposable {
  #controller: AbortController = new AbortController();
  #filters: Filter[];
  #sorters: Sorter[];

  #items: Item[] = [];

  constructor(filters: Filter[], sorters: Sorter[]) {
    this.#filters = filters;
    this.#sorters = sorters;
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
    denops: Denops,
    items: Item[],
    query: string,
  ): void {
    this.#abort(); // Cancel previous processing

    const { signal } = this.#controller;
    const inner = async () => {
      if (signal.aborted) return;

      let stream = ReadableStream.from(items);
      for (const filter of this.#filters) {
        const transform = await filter.getStream(denops, query, { signal });
        if (transform) {
          stream = stream.pipeThrough(transform, { signal });
        }
      }

      const filteredItems: Item[] = [];
      await stream.pipeTo(
        new WritableStream({
          write: (chunk) => {
            filteredItems.push(chunk);
          },
        }),
        { signal },
      );
      if (signal.aborted) return;

      let processedItems = [...filteredItems];
      for (const sorter of this.#sorters) {
        processedItems = await sorter.sort(denops, processedItems, { signal });
      }
      this.#items = processedItems;
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
