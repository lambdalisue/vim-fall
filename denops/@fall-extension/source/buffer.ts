import type { GetSource } from "../../@fall/source.ts";
import * as fn from "https://deno.land/x/denops_std@v6.3.0/function/mod.ts";
import { assert, is } from "jsr:@core/unknownutil@3.18.0";

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
