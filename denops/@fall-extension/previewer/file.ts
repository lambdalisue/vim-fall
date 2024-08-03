import type { GetPreviewer } from "jsr:@lambdalisue/vim-fall@^0.6.0/previewer";
import { basename } from "jsr:@std/path@^1.0.0/basename";
import * as fn from "jsr:@denops/std@^7.0.0/function";
import { assert, is } from "jsr:@core/unknownutil@^4.0.0";

import { retrieve } from "../util.ts";

const decoder = new TextDecoder("utf-8", { fatal: true });

const isOptions = is.StrictOf(is.PartialOf(is.ObjectOf({
  attrs: is.ArrayOf(is.String),
  lineAttrs: is.ArrayOf(is.String),
  columnAttrs: is.ArrayOf(is.String),
})));

export const getPreviewer: GetPreviewer = (denops, options) => {
  assert(options, isOptions);
  const attrs = options.attrs ?? [
    "detail.path",
    "detail.bufname",
    "value",
  ];
  const lineAttrs = options.lineAttrs ?? ["detail.line"];
  const columnAttrs = options.columnAttrs ?? ["detail.column"];
  return {
    async preview({ item }, { signal }) {
      const path = retrieve(item, attrs, is.String);
      if (!path) {
        return;
      }
      const abspath = await fn.fnamemodify(denops, path, ":p");
      signal?.throwIfAborted();

      const data = await Deno.readFile(abspath, {
        signal,
      });
      signal?.throwIfAborted();

      const line = retrieve(item, lineAttrs, is.Number);
      const column = retrieve(item, columnAttrs, is.Number);
      try {
        const text = decoder.decode(data);
        return {
          content: splitText(text),
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

function splitText(text: string): string[] {
  const lines = text.split(/\r?\n/g);
  return lines.at(-1) === "" ? lines.slice(0, -1) : lines;
}
