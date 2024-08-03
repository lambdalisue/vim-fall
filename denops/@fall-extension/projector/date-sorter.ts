import type { GetProjector } from "jsr:@lambdalisue/vim-fall@^0.6.0/projector";
import { assert, is } from "jsr:@core/unknownutil@^4.0.0";

import { retrieve } from "../util.ts";

const isOptions = is.StrictOf(is.PartialOf(is.ObjectOf({
  attrs: is.ArrayOf(is.String),
  reverse: is.Boolean,
})));

const isDate = is.InstanceOf(Date);

export const getProjector: GetProjector = (_denops, options) => {
  assert(options, isOptions);
  const attrs = options.attrs ?? ["value"];
  const alpha = options.reverse ? -1 : 1;
  return {
    project({ items }, { signal }) {
      return items.toSorted((a, b) => {
        signal?.throwIfAborted();
        const ta = retrieve(a, attrs, isDate);
        const tb = retrieve(b, attrs, isDate);
        if (!ta || !tb) return 0;
        return Math.sign(tb.getTime() - ta.getTime()) * alpha;
      });
    },
  };
};
