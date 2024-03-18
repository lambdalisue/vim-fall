import type { Sorter } from "https://deno.land/x/fall_core@v0.6.0/mod.ts";
import { assert, is } from "https://deno.land/x/unknownutil@v3.16.3/mod.ts";

const isOptions = is.StrictOf(is.PartialOf(is.ObjectOf({
  reverse: is.Boolean,
})));

export function getSorter(
  options: Record<string, unknown>,
): Sorter {
  assert(options, isOptions);
  return {
    sort: (_denops, items) => {
      return options.reverse ? items.reverse() : items;
    },
  };
}
