import type { Denops } from "jsr:@denops/std@^7.3.0";

import type { IdItem } from "./item.ts";

export type MatchParams<T> = {
  /**
   * User input query.
   */
  readonly query: string;
  /**
   * Items to match.
   */
  readonly items: readonly IdItem<T>[];
};

export type Matcher<T> = {
  /**
   * Match items.
   *
   * @param denops Denops instance.
   * @param params Parameters to match items.
   * @param options Options.
   */
  match(
    denops: Denops,
    params: MatchParams<T>,
    options: { signal?: AbortSignal },
  ): AsyncIterableIterator<IdItem<T>>;
};

/**
 * Define a matcher.
 *
 * @param match The function to match items.
 * @returns The matcher.
 */
export function defineMatcher<T>(
  match: (
    denops: Denops,
    params: MatchParams<T>,
    options: { signal?: AbortSignal },
  ) => AsyncIterableIterator<IdItem<T>>,
): Matcher<T> {
  return { match };
}
