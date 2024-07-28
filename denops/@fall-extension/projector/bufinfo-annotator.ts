import type { GetProjector } from "jsr:@lambdalisue/vim-fall@0.6.0/projector";
import * as fn from "jsr:@denops/std@7.0.0/function";
import { assert, is } from "jsr:@core/unknownutil@3.18.0";

import { retrieve } from "../util.ts";

const isOptions = is.StrictOf(is.PartialOf(is.ObjectOf({
  attrs: is.ArrayOf(is.String),
})));

export const getProjector: GetProjector = (denops, options) => {
  assert(options, isOptions);
  const attrs = options.attrs ?? [
    "detail.bufnr",
    "detail.bufname",
    "detail.path",
    "value",
  ];
  return {
    async project({ items }, { signal }) {
      return await Promise.all(items.map(async (item) => {
        signal?.throwIfAborted();
        const expr = retrieve(item, attrs, is.UnionOf([is.Number, is.String]));
        if (expr == undefined) {
          return item;
        }
        const bufinfo = (await fn.getbufinfo(denops, expr)).at(0);
        if (bufinfo == undefined) {
          return item;
        }
        return {
          ...item,
          detail: {
            ...item.detail,
            bufinfo,
          },
        };
      }));
    },
  };
};
