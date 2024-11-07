import type { Denops } from "jsr:@denops/std@^7.3.0";

import type { IdItem } from "../../item.ts";
import type { CollectParams, Source } from "../../source.ts";

/**
 * A source to collect fixed items.
 */
export class ListSource<T> implements Source<T> {
  readonly #items: readonly IdItem<T>[];

  constructor(items: readonly IdItem<T>[]) {
    this.#items = items;
  }

  async *collect(
    _denops: Denops,
    _params: CollectParams,
    _options: { signal?: AbortSignal },
  ): AsyncIterableIterator<IdItem<T>> {
    yield* this.#items;
  }
}
