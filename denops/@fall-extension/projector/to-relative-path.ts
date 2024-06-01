import type { GetProjector } from "jsr:@lambdalisue/vim-fall@0.6.0/projector";
import * as fn from "https://deno.land/x/denops_std@v6.4.0/function/mod.ts";
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
        const path = relative(cwd, item.detail.path);
        if (item.value === item.detail.path) {
          return {
            ...item,
            detail: {
              ...item.detail,
              path,
            },
            value: path,
          };
        } else {
          return {
            ...item,
            detail: {
              ...item.detail,
              path,
            },
          };
        }
      });
    },
  };
};
