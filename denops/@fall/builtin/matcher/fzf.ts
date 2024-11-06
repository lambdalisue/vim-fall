import type { Denops } from "jsr:@denops/std@^7.3.0";
import { asyncExtendedMatch, AsyncFzf } from "npm:fzf@^0.5.2";

import type { IdItem } from "../../item.ts";
import type { Matcher, MatchParams } from "../../matcher.ts";

type Options = {
  casing?: "smart-case" | "case-sensitive" | "case-insensitive";
  normalize?: boolean;
  sort?: boolean;
  forward?: boolean;
};

export class FzfMatcher<T> implements Matcher<T> {
  #casing: "smart-case" | "case-sensitive" | "case-insensitive";
  #normalize: boolean;
  #sort: boolean;
  #forward: boolean;

  constructor(options: Options = {}) {
    this.#casing = options.casing ?? "smart-case";
    this.#normalize = options.normalize ?? true;
    this.#sort = options.sort ?? true;
    this.#forward = options.forward ?? true;
  }

  async *match(
    _denops: Denops,
    { items, query }: MatchParams<T>,
    { signal }: { signal?: AbortSignal },
  ): AsyncIterableIterator<IdItem<T>> {
    const terms = query.split(/\s+/).filter((v) => v.length > 0);
    const filter = async (items: readonly IdItem<T>[], term: string) => {
      const fzf = new AsyncFzf(items, {
        selector: (v) => v.value,
        casing: this.#casing,
        normalize: this.#normalize,
        sort: this.#sort,
        forward: this.#forward,
        match: asyncExtendedMatch,
      });
      const found = await fzf.find(term);
      signal?.throwIfAborted();
      return found
        .map((v) => {
          const column = Math.max(0, v.start + 1);
          const length = Math.max(0, v.end - v.start);
          if (length === 0) return undefined;
          return {
            ...v.item,
            decorations: [
              ...(v.item.decorations ?? []),
              { column, length },
            ],
          };
        })
        .filter((v) => !!v);
    };
    for (const term of terms.reverse()) {
      items = await filter(items, term);
    }
    yield* items;
  }
}
