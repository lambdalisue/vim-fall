import type { GetPreviewer } from "jsr:@lambdalisue/vim-fall@0.6.0/previewer";
import { assert, is, maybe } from "jsr:@core/unknownutil@3.18.0";

const isOptions = is.StrictOf(is.PartialOf(is.ObjectOf({
  attribute: is.String,
  lineAttribute: is.String,
  columnAttribute: is.String,
})));

export const getPreviewer: GetPreviewer = (_denops, options) => {
  assert(options, isOptions);
  const attribute = options.attribute ?? "text";
  const lineAttribute = options.lineAttribute ?? "line";
  const columnAttribute = options.columnAttribute ?? "column";
  return {
    preview({ item }) {
      const text = maybe(item.detail[attribute], is.String);
      if (!text) {
        return;
      }
      const line = maybe(item.detail[lineAttribute], is.Number);
      const column = maybe(item.detail[columnAttribute], is.Number);
      return {
        content: text.split(/\r?\n/g),
        line,
        column,
      };
    },
  };
};
