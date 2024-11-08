import { defineMatcher, type Matcher } from "../../matcher.ts";
import { getByteLength } from "../_util.ts";

type Options = {
  smartCase?: boolean;
  ignoreCase?: boolean;
};

export function substring<T>(options: Options = {}): Matcher<T> {
  const case_ = options.ignoreCase
    ? "ignore"
    : options.smartCase
    ? "smart"
    : "none";
  const shouldIgnoreCase = (query: string): boolean => {
    switch (case_) {
      case "ignore":
        return true;
      case "smart":
        return query.toLowerCase() === query;
      default:
        return false;
    }
  };
  return defineMatcher<T>(
    async function* (_denops, { query, items }, { signal }) {
      const ignoreCase = shouldIgnoreCase(query);
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
    },
  );
}
