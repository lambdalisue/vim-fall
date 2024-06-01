import type { GetPreviewer } from "jsr:@lambdalisue/vim-fall@0.6.0/previewer";
import { collect } from "https://deno.land/x/denops_std@v6.3.0/batch/mod.ts";
import { basename } from "https://deno.land/std@0.224.0/path/basename.ts";
import * as fn from "https://deno.land/x/denops_std@v6.4.0/function/mod.ts";
import { assert, is, maybe } from "jsr:@core/unknownutil@3.18.0";

const isOptions = is.StrictOf(is.PartialOf(is.ObjectOf({
  attribute: is.String,
  lineAttribute: is.String,
  columnAttribute: is.String,
})));

export const getPreviewer: GetPreviewer = (denops, options) => {
  assert(options, isOptions);
  const attribute = options.attribute ?? "bufnr";
  const lineAttribute = options.lineAttribute ?? "line";
  const columnAttribute = options.columnAttribute ?? "column";
  return {
    async preview({ item }, { signal }) {
      const bufnr = maybe(item.detail[attribute], is.Number);
      if (!bufnr) {
        return;
      }
      const [bufloaded, bufname, content] = await collect(denops, (denops) => [
        fn.bufloaded(denops, bufnr),
        fn.bufname(denops, bufnr),
        fn.getbufline(denops, bufnr, 1, "$"),
      ]);
      signal?.throwIfAborted();

      if (!bufloaded) {
        return;
      }
      const line = maybe(item.detail[lineAttribute], is.Number);
      const column = maybe(item.detail[columnAttribute], is.Number);
      return {
        content,
        line,
        column,
        filename: basename(bufname),
      };
    },
  };
};
