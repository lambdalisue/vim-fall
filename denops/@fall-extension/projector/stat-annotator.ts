import type { GetProjector } from "jsr:@lambdalisue/vim-fall@0.6.0/projector";
import { as, is } from "jsr:@core/unknownutil@^4.0.0";

const isPathDetail = is.ObjectOf({
  path: is.String,
  stat: as.Optional(is.Record),
});

export const getProjector: GetProjector = (_denops, _options) => {
  return {
    async project({ items }, { signal }) {
      return await Promise.all(items.map(async (item) => {
        signal?.throwIfAborted();
        if (!isPathDetail(item.detail)) {
          return item;
        }
        if (item.detail.stat) {
          return item;
        }
        try {
          const stat = await Deno.stat(item.detail.path);
          return {
            ...item,
            detail: {
              ...item.detail,
              stat,
            },
          };
        } catch (err) {
          if (err instanceof Deno.errors.NotFound) {
            return item;
          }
          throw err;
        }
      }));
    },
  };
};
