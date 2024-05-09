import type { Sorter } from "https://deno.land/x/fall_core@v0.8.0/mod.ts";
import { assert, is } from "jsr:@core/unknownutil@3.18.0";

const isOptions = is.StrictOf(is.PartialOf(is.ObjectOf({
  reverse: is.Boolean,
})));

export function getSorter(
  options: Record<string, unknown>,
): Sorter {
  assert(options, isOptions);
  const alpha = options.reverse ? -1 : 1;
  return {
    sort: (_denops, items) => {
      items.sort((a, b) => {
        return a.value.localeCompare(b.value) * alpha;
      });
      return items;
    },
  };
}
