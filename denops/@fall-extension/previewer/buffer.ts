import type { GetPreviewer } from "jsr:@lambdalisue/vim-fall@0.6.0/previewer";
import { collect } from "jsr:@denops/std@7.0.0/batch";
import { basename } from "jsr:@std/path@1.0.2/basename";
import * as fn from "jsr:@denops/std@7.0.0/function";
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
