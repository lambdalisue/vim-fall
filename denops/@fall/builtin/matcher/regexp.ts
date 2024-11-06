import type { Denops } from "jsr:@denops/std@^7.3.0";

import type { IdItem } from "../../item.ts";
import type { Matcher, MatchParams } from "../../matcher.ts";
import { getByteLength } from "../_util.ts";

export class RegexpMatcher<T> implements Matcher<T> {
  async *match(
    _denops: Denops,
    { query, items }: MatchParams<T>,
    { signal }: { signal?: AbortSignal },
  ): AsyncIterableIterator<IdItem<T>> {
    const pattern = new RegExp(query, "g");
    for await (const item of items) {
      signal?.throwIfAborted();
      if (!pattern.test(item.value)) {
        continue;
      }
      const matches = [...item.value.matchAll(pattern)];
      const decorations = matches
        .map((match) => {
          const length = match[0].length;
          const index = match.index ?? 0;
          const head = item.value.slice(0, index);
          const column = 1 + getByteLength(head);
          return { column, length };
        });
      yield {
        ...item,
        decorations: item.decorations
          ? [...item.decorations, ...decorations]
          : decorations,
      };
    }
  }
}
