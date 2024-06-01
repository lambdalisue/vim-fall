import type { GetProjector } from "jsr:@lambdalisue/vim-fall@0.6.0/projector";
import { assert, is } from "jsr:@core/unknownutil@3.18.0";

const isOptions = is.StrictOf(is.PartialOf(is.ObjectOf({
  reverse: is.Boolean,
})));

export const getProjector: GetProjector = (_denops, options) => {
  assert(options, isOptions);
  const alpha = options.reverse ? -1 : 1;
  return {
    project({ items }, { signal }) {
      return items.toSorted((a, b) => {
        signal?.throwIfAborted();
        return a.value.localeCompare(b.value) * alpha;
      });
    },
  };
};
