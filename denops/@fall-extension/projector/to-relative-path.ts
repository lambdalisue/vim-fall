import type { GetProjector } from "jsr:@lambdalisue/vim-fall@0.6.0/projector";
import * as fn from "jsr:@denops/std@7.0.0/function";
import { relative } from "jsr:@std/path@0.225.0/relative";
import { is } from "jsr:@core/unknownutil@3.18.0";

const isPathDetail = is.ObjectOf({
  path: is.String,
});

export const getProjector: GetProjector = async (denops, _options) => {
  const cwd = await fn.getcwd(denops);
  return {
    project({ items }, { signal }) {
      return items.map((item) => {
        signal?.throwIfAborted();
        if (!isPathDetail(item.detail)) {
          return item;
        }
        if (item.value !== item.detail.path) {
          return item;
        }
        const relpath = relative(cwd, item.detail.path);
        return {
          ...item,
          value: relpath,
        };
      });
    },
  };
};
