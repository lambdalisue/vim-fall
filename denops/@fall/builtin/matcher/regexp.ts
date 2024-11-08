import { defineMatcher, type Matcher } from "../../matcher.ts";
import { getByteLength } from "../_util.ts";

export function regexp<T>(): Matcher<T> {
  return defineMatcher(async function* (_denops, { query, items }, { signal }) {
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
  });
}
