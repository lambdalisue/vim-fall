import type { GetSource } from "jsr:@lambdalisue/vim-fall@0.6.0/source";
import * as fn from "jsr:@denops/std@7.0.0/function";
import { assert, is } from "jsr:@core/unknownutil@^4.0.0";

const isOptions = is.StrictOf(is.PartialOf(is.ObjectOf({
  mode: is.LiteralOneOf(["buflisted", "bufloaded", "bufmodified"] as const),
})));

export const getSource: GetSource = (denops, options) => {
  assert(options, isOptions);
  const mode = options.mode;
  return {
    async stream() {
      const bufinfo = await fn.getbufinfo(denops);
      const items = bufinfo
        .filter((v) => {
          if (mode === "buflisted") {
            return v.listed;
          } else if (mode === "bufloaded") {
            return v.loaded;
          } else if (mode === "bufmodified") {
            return v.changed;
          }
          return true;
        })
        .map((v) => ({
          value: v.name,
          detail: {
            path: v.name,
            line: v.lnum,
            bufnr: v.bufnr,
            listed: v.listed,
            loaded: v.loaded,
            hidden: v.hidden,
            modified: v.changed,
          },
        }));
      return ReadableStream.from(items);
    },
  };
};
