import type { Denops } from "jsr:@denops/std@^7.3.0";

import type { IdItem } from "../../item.ts";
import type { Matcher, MatchParams } from "../../matcher.ts";

export class NoopMatcher<T> implements Matcher<T> {
  async *match(
    _denops: Denops,
    { items }: MatchParams<T>,
    _options: { signal?: AbortSignal },
  ): AsyncIterableIterator<IdItem<T>> {
    yield* items;
  }
}
