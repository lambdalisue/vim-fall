import type { Denops } from "jsr:@denops/std@^7.3.0";

import type { Item } from "./item.ts";

export type CollectParams = {
  /**
   * The arguments passed to the picker.
   */
  readonly args: readonly string[];
};

export type Source<T> = {
  /**
   * Collect items.
   *
   * @param denops The Denops instance.
   * @param params The parameters to collect items.
   * @param options The options.
   * @param options.signal The signal to cancel the operation.
   */
  collect(
    denops: Denops,
    params: CollectParams,
    options: { signal?: AbortSignal },
  ): AsyncIterableIterator<Item<T>>;
};
