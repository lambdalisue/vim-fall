import type { Sorter } from "https://deno.land/x/fall_core@v0.8.0/mod.ts";
import { assert, is } from "jsr:@core/unknownutil@3.18.0";

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
