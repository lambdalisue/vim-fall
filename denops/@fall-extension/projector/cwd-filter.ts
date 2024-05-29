import type { GetProjector } from "../../@fall/projector.ts";
import * as fn from "https://deno.land/x/denops_std@v6.4.0/function/mod.ts";
import { common } from "jsr:@std/path@0.225.0/common";
import { is } from "jsr:@core/unknownutil@3.18.0";

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
