import { asyncExtendedMatch, AsyncFzf } from "npm:fzf@^0.5.2";

import type { IdItem } from "../../item.ts";
import { defineMatcher, type Matcher } from "../../matcher.ts";

type Options = {
  casing?: "smart-case" | "case-sensitive" | "case-insensitive";
  normalize?: boolean;
  sort?: boolean;
  forward?: boolean;
};

export function fzf<T>(options: Options = {}): Matcher<T> {
  const casing = options.casing ?? "smart-case";
  const normalize = options.normalize ?? true;
  const sort = options.sort ?? true;
  const forward = options.forward ?? true;
  return defineMatcher(async function* (_denops, { items, query }, { signal }) {
    const terms = query.split(/\s+/).filter((v) => v.length > 0);
    const filter = async (items: readonly IdItem<T>[], term: string) => {
      const fzf = new AsyncFzf(items, {
        selector: (v) => v.value,
        casing,
        normalize,
        sort,
        forward,
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
  });
}
