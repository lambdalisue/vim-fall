import type { GetPreviewer } from "../../@fall/previewer.ts";
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
  const attribute = options.attribute ?? "bufname";
  const lineAttribute = options.lineAttribute ?? "line";
  const columnAttribute = options.columnAttribute ?? "column";
  return {
    async preview({ item }) {
      const bufname = maybe(item.detail[attribute], is.String);
      if (!bufname) {
        return;
      }
      if (!(await fn.bufloaded(denops, bufname))) {
        return;
      }
      const line = maybe(item.detail[lineAttribute], is.Number);
      const column = maybe(item.detail[columnAttribute], is.Number);
      const content = await fn.getbufline(denops, bufname, 1, "$");
      return {
        content,
        line,
        column,
        filename: basename(bufname),
      };
    },
  };
};
