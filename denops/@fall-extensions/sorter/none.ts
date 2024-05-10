import type { GetSorter } from "https://deno.land/x/fall_core@v0.9.0/mod.ts";
import { assert, is } from "jsr:@core/unknownutil@3.18.0";

const isOptions = is.StrictOf(is.PartialOf(is.ObjectOf({
  reverse: is.Boolean,
})));

export const getSorter: GetSorter = (_denops, options) => {
  assert(options, isOptions);
  return {
    sort({ items }) {
      return options.reverse ? items.reverse() : items;
    },
  };
};
