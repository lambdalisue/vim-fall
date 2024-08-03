import type { GetProjector } from "jsr:@lambdalisue/vim-fall@^0.6.0/projector";
import * as fn from "jsr:@denops/std@^7.0.0/function";
import { common } from "jsr:@std/path@^0.225.0/common";
import { is } from "jsr:@core/unknownutil@^4.0.0";

const isPathDetail = is.ObjectOf({
  path: is.String,
});

export const getProjector: GetProjector = async (denops, _options) => {
  const cwd = await fn.getcwd(denops);
  return {
    project({ items }, { signal }) {
      return items.filter((item) => {
        signal?.throwIfAborted();
        if (!isPathDetail(item.detail)) {
          return false;
        }
        return cwd === common([cwd, item.detail.path]);
      });
    },
  };
};
