import type { Denops } from "jsr:@denops/std@^7.3.0";

import type { Promish } from "./_typeutil.ts";
import type { IdItem } from "./item.ts";

export type SortParams<T> = {
  readonly items: IdItem<T>[];
};

export type Sorter<T> = {
  /**
   * Sort items.
   *
   * This method sorts items in place.
   *
   * @param denops The Denops instance.
   * @param params The parameters to sort an item.
   * @param options The options for sorting.
   * @param options.signal The signal to abort.
   */
  sort(
    denops: Denops,
    params: SortParams<T>,
    options: { signal?: AbortSignal },
  ): Promish<void>;
};

/**
 * Define a sorter.
 *
 * @param sort The function to sort items.
 * @returns The sorter.
 */
export function defineSorter<T>(
  sort: (
    denops: Denops,
    params: SortParams<T>,
    options: { signal?: AbortSignal },
  ) => void | Promise<void>,
): Sorter<T> {
  return { sort };
}

/**
 * Compose multiple sorters.
 *
 * @param sorters The sorters to compose.
 * @returns The composed sorter.
 */
export function composeSorter<
  T,
  S extends [Sorter<T>, Sorter<T>, ...Sorter<T>[]],
>(...sorters: S): Sorter<T> {
  return {
    sort: async (denops, params, options) => {
      for (const sorter of sorters) {
        await sorter.sort(denops, params, options);
      }
    },
  };
}
