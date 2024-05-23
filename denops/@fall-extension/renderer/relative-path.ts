import type { GetRenderer } from "../../@fall/renderer.ts";
import * as fn from "https://deno.land/x/denops_std@v6.4.0/function/mod.ts";
import { relative } from "jsr:@std/path@0.225.0/relative";
import { is } from "jsr:@core/unknownutil@3.18.0";

const isPathDetail = is.ObjectOf({
  path: is.String,
});

export const getRenderer: GetRenderer = async (denops, _options) => {
  const cwd = await fn.getcwd(denops);
  return {
    render({ items }) {
      return items.map((v) => {
        if (isPathDetail(v.detail)) {
          const path = relative(cwd, v.detail.path);
          const label = v.label ?? path;
          return {
            ...v,
            detail: {
              ...v.detail,
              path,
            },
            label,
          };
        }
        return v;
      });
    },
  };
};
