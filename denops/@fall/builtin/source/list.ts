import type { Denops } from "jsr:@denops/std@^7.3.0";

import type { Item } from "../../item.ts";
import type { CollectParams, Source } from "../../source.ts";

/**
 * A source to collect fixed items.
 */
export class ListSource<T> implements Source<T> {
  readonly #items: readonly Item<T>[];

  constructor(items: readonly Item<T>[]) {
    this.#items = items;
  }

  async *collect(
    _denops: Denops,
    _params: CollectParams,
    _options: { signal?: AbortSignal },
  ): AsyncIterableIterator<Item<T>> {
    yield* this.#items;
  }
}
