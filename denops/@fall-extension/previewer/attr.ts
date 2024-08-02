import type { GetPreviewer } from "jsr:@lambdalisue/vim-fall@0.6.0/previewer";
import { assert, is } from "jsr:@core/unknownutil@^4.0.0";

import { retrieve } from "../util.ts";

const isOptions = is.StrictOf(is.PartialOf(is.ObjectOf({
  attrs: is.ArrayOf(is.String),
  lineAttrs: is.ArrayOf(is.String),
  columnAttrs: is.ArrayOf(is.String),
  nowrap: is.Boolean,
})));

export const getPreviewer: GetPreviewer = (_denops, options) => {
  assert(options, isOptions);
  const attrs = options.attrs ?? [
    "detail.content",
    "detail.description",
  ];
  const lineAttrs = options.lineAttrs ?? ["detail.line"];
  const columnAttrs = options.columnAttrs ?? ["detail.column"];
  const nowrap = options.nowrap ?? false;
  return {
    preview({ item, width }) {
      let content = retrieve(
        item,
        attrs,
        is.UnionOf([is.String, is.ArrayOf(is.String)]),
      );
      if (content == undefined) {
        return;
      }
      if (!nowrap) {
        // https://stackoverflow.com/a/51506718
        const wrap = (s: string, w: number) =>
          s.replace(
            new RegExp(`(?![^\\n]{1,${w}}$)([^\\n]{1,${w}})\\s`, "g"),
            "$1\n",
          );
        content = wrap(
          is.String(content) ? content : content.join("\n"),
          width,
        );
      }
      const line = retrieve(item, lineAttrs, is.Number);
      const column = retrieve(item, columnAttrs, is.Number);
      return {
        content: is.String(content) ? content.split(/\r?\n/g) : content,
        line,
        column,
      };
    },
  };
};
