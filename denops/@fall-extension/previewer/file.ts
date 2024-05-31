import type { GetPreviewer } from "../../@fall/previewer.ts";
import { basename } from "https://deno.land/std@0.224.0/path/basename.ts";
import * as fn from "https://deno.land/x/denops_std@v6.4.0/function/mod.ts";
import { assert, is, maybe } from "jsr:@core/unknownutil@3.18.0";

const decoder = new TextDecoder("utf-8", { fatal: true });

const isOptions = is.StrictOf(is.PartialOf(is.ObjectOf({
  attribute: is.String,
  lineAttribute: is.String,
  columnAttribute: is.String,
})));

export const getPreviewer: GetPreviewer = (denops, options) => {
  assert(options, isOptions);
  const attribute = options.attribute ?? "path";
  const lineAttribute = options.lineAttribute ?? "line";
  const columnAttribute = options.columnAttribute ?? "column";
  return {
    async preview({ item }, { signal }) {
      const path = maybe(item.detail[attribute], is.String);
      if (!path) {
        return;
      }

      const line = maybe(item.detail[lineAttribute], is.Number);
      const column = maybe(item.detail[columnAttribute], is.Number);
      const abspath = await fn.fnamemodify(denops, path, ":p");
      signal?.throwIfAborted();

      const data = await Deno.readFile(abspath, {
        signal,
      });
      signal?.throwIfAborted();

      try {
        const text = decoder.decode(data);
        return {
          content: text.split(/\r?\n/g),
          line,
          column,
          filename: basename(abspath),
        };
      } catch (err) {
        if (err instanceof TypeError) {
          return {
            content: [
              "No preview for binary file is available.",
            ],
          };
        }
        throw err;
      }
    },
  };
};
