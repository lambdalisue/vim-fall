import type { Denops } from "https://deno.land/x/denops_std@v6.4.0/mod.ts";
import type {
  Filter,
  Item,
  Sorter,
} from "https://deno.land/x/fall_core@v0.5.1/mod.ts";

import { dispatch } from "../../util/event.ts";

/**
 * Process items with a filter and a sorter and store them in the internal state.
 */
export class ItemProcessor implements Disposable {
  #controller: AbortController = new AbortController();
  #filters: [string, Filter][];
  #sorters: [string, Sorter][];

  #items: Item[] = [];
  #filterIndex = 0;
  #sorterIndex = 0;

  constructor(filters: Map<string, Filter>, sorters: Map<string, Sorter>) {
    this.#filters = [...filters.entries()];
    this.#sorters = [...sorters.entries()];
  }

  /**
   * Processed items
   */
  get items(): Item[] {
    return this.#items;
  }

  /**
   * Current filter index
   */
  get filterIndex(): number {
    return this.#filterIndex;
  }

  set filterIndex(value: number) {
    this.#filterIndex = value % this.#filters.length;
  }

  /**
   * Current filter
   *
   * Returns `undefined` if no filter is available.
   */
  get filter(): Filter | undefined {
    return this.#filters.at(this.#filterIndex)?.[1];
  }

  /**
   * Name of the current filter
   *
   * Returns `undefined` if no filter is available.
   */
  get filterName(): string | undefined {
    return this.#filters.at(this.#filterIndex)?.[0];
  }

  /**
   * Current sorter index
   */
  get sorterIndex(): number {
    return this.#sorterIndex;
  }

  set sorterIndex(value: number) {
    this.#sorterIndex = value % this.#sorters.length;
  }

  /**
   * Current sorter
   *
   * Returns `undefined` if no sorter is available.
   */
  get sorter(): Sorter | undefined {
    return this.#sorters.at(this.#sorterIndex)?.[1];
  }

  /**
   * Name of the current sorter
   *
   * Returns `undefined` if no sorter is available.
   */
  get sorterName(): string | undefined {
    return this.#sorters.at(this.#sorterIndex)?.[0];
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
      // TODO: Pass 'signal'
      const filter = await this.filter?.getStream(denops, query);
      if (signal.aborted) return;

      const stream = filter
        ? ReadableStream.from(items).pipeThrough(filter, { signal })
        : ReadableStream.from(items);
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

      const processedItems = this.sorter
        // TODO: Pass 'signal'
        ? await this.sorter.sort(denops, filteredItems)
        : filteredItems;
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
