import type { GetProjector } from "https://deno.land/x/fall_core@v0.10.0/mod.ts";
import { assert, is } from "jsr:@core/unknownutil@3.18.0";

const isOptions = is.StrictOf(is.PartialOf(is.ObjectOf({
  reverse: is.Boolean,
})));

export const getProjector: GetProjector = (_denops, options) => {
  assert(options, isOptions);
  const alpha = options.reverse ? -1 : 1;
  return {
    project({ items }) {
      return items.toSorted((a, b) => {
        return a.value.localeCompare(b.value) * alpha;
      });
    },
  };
};
