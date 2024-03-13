import type { Denops } from "https://deno.land/x/denops_std@v6.3.0/mod.ts";
import type {
  Filter,
  Item,
  Sorter,
} from "https://deno.land/x/fall_core@v0.5.1/mod.ts";

import { dispatch } from "../../util/event.ts";

export class ItemProcessor implements Disposable {
  #controller: AbortController = new AbortController();
  #filters: [string, Filter][];
  #sorters: [string, Sorter][];

  #items: Item[] = [];
  #currentFilterIndex: number = 0;
  #currentSorterIndex: number = 0;

  constructor(filters: Map<string, Filter>, sorters: Map<string, Sorter>) {
    this.#filters = [...filters.entries()];
    this.#sorters = [...sorters.entries()];
  }

  get items(): Item[] {
    return this.#items;
  }

  get currentFilterIndex(): number {
    return this.#currentFilterIndex;
  }

  set currentFilterIndex(value: number) {
    this.#currentFilterIndex = value % this.#filters.length;
  }

  get currentFilter(): Filter | undefined {
    return this.#filters.at(this.#currentFilterIndex)?.[1];
  }

  get currentFilterName(): string | undefined {
    return this.#filters.at(this.#currentFilterIndex)?.[0];
  }

  get currentSorterIndex(): number {
    return this.#currentSorterIndex;
  }

  set currentSorterIndex(value: number) {
    this.#currentSorterIndex = value % this.#sorters.length;
  }

  get currentSorter(): Sorter | undefined {
    return this.#sorters.at(this.#currentSorterIndex)?.[1];
  }

  get currentSorterName(): string | undefined {
    return this.#sorters.at(this.#currentSorterIndex)?.[0];
  }

  start(
    denops: Denops,
    items: Item[],
    query: string,
  ): void {
    this.#abort(); // Cancel previous processing

    const { signal } = this.#controller;
    const inner = async () => {
      const filter = await this.currentFilter?.getStream(denops, query);
      if (signal.aborted) return;

      const stream = filter
        ? ReadableStream.from(items).pipeThrough(filter)
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

      const processedItems = this.currentSorter
        ? await this.currentSorter.sort(denops, filteredItems)
        : filteredItems;
      if (signal.aborted) return;

      this.#items = processedItems;
      dispatch("item-processor-succeeded", undefined);
    };
    inner()
      .catch((err) => {
        if (err.name === "AbortError") return;
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
