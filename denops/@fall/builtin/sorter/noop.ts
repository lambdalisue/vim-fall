import type { Denops } from "jsr:@denops/std@^7.3.0";

import type { Sorter, SortParams } from "../../sorter.ts";

/**
 * A sorter to do nothing.
 */
export class NoopSorter<T> implements Sorter<T> {
  sort(
    _denops: Denops,
    _params: SortParams<T>,
    _options: { signal?: AbortSignal },
  ) {
    return;
  }
}
