import type { GetProjector } from "jsr:@lambdalisue/vim-fall@0.6.0/projector";
import { exists } from "jsr:@std/fs@0.229.0/exists";
import { is } from "jsr:@core/unknownutil@3.18.0";

const isPathDetail = is.ObjectOf({
  path: is.String,
});

export const getProjector: GetProjector = (_denops, _options) => {
  return {
    async project({ items }, { signal }) {
      return (await Promise.all(items.map(async (item) => {
        signal?.throwIfAborted();
        if (isPathDetail(item.detail)) {
          if (await exists(item.detail.path)) {
            return item;
          }
        }
        return undefined;
      }))).filter(isDefined);
    },
  };
};

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}
