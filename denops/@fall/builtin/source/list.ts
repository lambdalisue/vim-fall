import type { IdItem } from "../../item.ts";
import { defineSource, type Source } from "../../source.ts";

export function list<T>(
  items: Iterable<IdItem<T>> | AsyncIterable<IdItem<T>>,
): Source<T> {
  return defineSource(async function* (_denops, _params, _options) {
    yield* items;
  });
}
