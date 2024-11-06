import type { Denops } from "jsr:@denops/std@^7.3.0";

import type { Sorter, SortParams } from "../../sorter.ts";

type Options = {
  reverse?: boolean;
};

/**
 * A sorter to sort items lexically.
 */
export class LexicalSorter<T> implements Sorter<T> {
  readonly #reverse: boolean;

  constructor(options: Readonly<Options> = {}) {
    this.#reverse = options.reverse ?? false;
  }

  sort(
    _denops: Denops,
    { items }: SortParams<T>,
    _options: { signal?: AbortSignal },
  ): void {
    if (this.#reverse) {
      items.sort((a, b) =>
        b.value < a.value ? -1 : (b.value > a.value ? 1 : 0)
      );
    } else {
      items.sort((a, b) =>
        a.value < b.value ? -1 : (a.value > b.value ? 1 : 0)
      );
    }
  }
}
