import type { Denops } from "jsr:@denops/std@^7.3.0";

import type { IdItem } from "../../item.ts";
import type { Matcher, MatchParams } from "../../matcher.ts";
import { getByteLength } from "../_util.ts";

type Options = {
  smartCase?: boolean;
  ignoreCase?: boolean;
};

export class SubstringMatcher<T> implements Matcher<T> {
  readonly #case: "smart" | "ignore" | "none";

  constructor(options: Options = {}) {
    this.#case = options.ignoreCase
      ? "ignore"
      : options.smartCase
      ? "smart"
      : "none";
  }

  #ignoreCase(query: string): boolean {
    switch (this.#case) {
      case "ignore":
        return true;
      case "smart":
        return query.toLowerCase() === query;
      default:
        return false;
    }
  }

  async *match(
    _denops: Denops,
    { query, items }: MatchParams<T>,
    { signal }: { signal?: AbortSignal },
  ): AsyncIterableIterator<IdItem<T>> {
    const ignoreCase = this.#ignoreCase(query);
    const norm = (v: string): string => ignoreCase ? v.toLowerCase() : v;
    const terms = query
      .split(/\s+/)
      .filter((v) => v.length > 0)
      .map(norm);
    const pattern = new RegExp(terms.join("|"), ignoreCase ? "ig" : "g");
    for await (const item of items) {
      signal?.throwIfAborted();
      if (terms.some((term) => !norm(item.value).includes(term))) {
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
