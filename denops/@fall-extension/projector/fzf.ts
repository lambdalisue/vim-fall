import type { GetProjector } from "../../@fall/projector.ts";
import type { ItemDecoration } from "../../@fall/item.ts";
import { AsyncFzf } from "npm:fzf@0.5.2";
import { assert, is } from "jsr:@core/unknownutil@3.18.0";

const isOptions = is.StrictOf(is.PartialOf(is.ObjectOf({})));

export const getProjector: GetProjector = (_denops, options) => {
  assert(options, isOptions);
  return {
    async project({ query, items }, { signal }) {
      const fzf = new AsyncFzf(items, {
        selector: (v) => v.label ?? v.value,
      });
      const found = await fzf.find(query);
      signal?.throwIfAborted();

      return found
        .map((v) => {
          const column = Math.max(0, v.start + 1);
          const length = Math.max(0, v.end - v.start);
          if (length === 0) return v.item;
          const decoration: ItemDecoration = {
            column,
            length,
          };
          return {
            ...v.item,
            decorations: [...v.item.decorations, decoration],
          };
        });
    },
  };
};
