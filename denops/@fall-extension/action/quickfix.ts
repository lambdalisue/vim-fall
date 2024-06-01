import type { GetAction } from "jsr:@lambdalisue/vim-fall@0.6.0/action";
import * as fn from "https://deno.land/x/denops_std@v6.3.0/function/mod.ts";
import { assert, is } from "jsr:@core/unknownutil@3.18.0";

const description = `
Send the selected items or projected items to quickfix.

TODO: Better description.
`.trim();

const isOptions = is.StrictOf(is.PartialOf(is.ObjectOf({
  what: is.PartialOf(is.ObjectOf({
    context: is.Unknown,
    id: is.Number,
    idx: is.UnionOf([is.Number, is.String]),
    nr: is.Number,
    title: is.String,
  })),
  action: is.LiteralOneOf(["a", "r", "f", " "] as const),
  after: is.String,
})));

const isGrepDetail = is.ObjectOf({
  path: is.String,
  line: is.OptionalOf(is.Number),
  column: is.OptionalOf(is.Number),
  length: is.OptionalOf(is.Number),
  content: is.OptionalOf(is.String),
});

const isPathDetail = is.ObjectOf({
  path: is.String,
  line: is.OptionalOf(is.Number),
  column: is.OptionalOf(is.Number),
});

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

export const getAction: GetAction = (denops, options) => {
  assert(options, isOptions);
  const what = options.what ?? {};
  const action = options.action ?? " ";
  const after = options.after;
  return {
    description,

    async invoke({ selectedItems, projectedItems }) {
      const source = selectedItems.length > 0 ? selectedItems : projectedItems;
      const items = source
        .map((item) => {
          if (isGrepDetail(item.detail)) {
            return {
              filename: item.detail.path,
              lnum: item.detail.line,
              col: item.detail.column,
              end_col: item.detail.column && item.detail.length
                ? item.detail.column + item.detail.length
                : undefined,
              text: item.detail.content,
            };
          } else if (isPathDetail(item.detail)) {
            return {
              filename: item.detail.path,
              lnum: item.detail.line,
              col: item.detail.column,
              text: (item.detail as { content?: string }).content,
            };
          }
          return undefined;
        })
        .filter(isDefined);
      try {
        await fn.setqflist(denops, [], action, {
          ...what,
          items,
        });
        if (after) {
          await denops.cmd(after);
        }
      } catch (err) {
        const m = err.message ?? err;
        console.warn(`[fall] Failed to set quickfix list: ${m}`);
      }
      return false;
    },
  };
};
