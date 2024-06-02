import type { GetPreviewer } from "jsr:@lambdalisue/vim-fall@0.6.0/previewer";
import { collect } from "https://deno.land/x/denops_std@v6.3.0/batch/mod.ts";
import { basename } from "https://deno.land/std@0.224.0/path/basename.ts";
import * as fn from "https://deno.land/x/denops_std@v6.4.0/function/mod.ts";
import { assert, is } from "jsr:@core/unknownutil@3.18.0";

import { retrieve } from "../util.ts";

const isOptions = is.StrictOf(is.PartialOf(is.ObjectOf({
  attrs: is.ArrayOf(is.String),
  lineAttrs: is.ArrayOf(is.String),
  columnAttrs: is.ArrayOf(is.String),
})));

export const getPreviewer: GetPreviewer = (denops, options) => {
  assert(options, isOptions);
  const attrs = options.attrs ?? [
    "detail.bufnr",
    "detail.bufname",
    "detail.path",
    "value",
  ];
  const lineAttrs = options.lineAttrs ?? ["detail.line"];
  const columnAttrs = options.columnAttrs ?? ["detail.column"];
  return {
    async preview({ item }, { signal }) {
      const expr = retrieve(item, attrs, is.UnionOf([is.Number, is.String]));
      if (expr == undefined) {
        return;
      }
      const [bufloaded, bufname, content] = await collect(denops, (denops) => [
        fn.bufloaded(denops, expr),
        fn.bufname(denops, expr),
        fn.getbufline(denops, expr, 1, "$"),
      ]);
      signal?.throwIfAborted();

      if (!bufloaded) {
        return;
      }
      const line = retrieve(item, lineAttrs, is.Number);
      const column = retrieve(item, columnAttrs, is.Number);
      return {
        content,
        line,
        column,
        filename: basename(bufname),
      };
    },
  };
};
