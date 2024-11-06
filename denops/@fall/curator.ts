import type { Denops } from "jsr:@denops/std@^7.3.0";

import type { IdItem } from "./item.ts";

export type CurateParams = {
  /**
   * The arguments passed to the picker.
   */
  readonly args: readonly string[];
  /**
   * User input query.
   */
  readonly query: string;
};

export type Curator<T> = {
  /**
   * Curate items.
   *
   * @param denops The Denops instance.
   * @param params The parameters to curate items.
   * @param options The options.
   * @param options.signal The signal to cancel the operation.
   */
  curate(
    denops: Denops,
    params: CurateParams,
    options: { signal?: AbortSignal },
  ): AsyncIterableIterator<IdItem<T>>;
};
