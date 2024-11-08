import { unreachable } from "jsr:@core/errorutil@^1.2.0/unreachable";
import * as fn from "jsr:@denops/std@^7.0.0/function";

import { defineSource, type Source } from "../../source.ts";

type Filter = "buflisted" | "bufloaded" | "bufmodified";

type Options = {
  /**
   * The mode to filter the buffer.
   */
  filter?: Filter;
};

type Detail = {
  bufnr: number;
  bufname: string;
  bufinfo: fn.BufInfo;
};

export function buffer(options: Readonly<Options> = {}): Source<Detail> {
  const filter = options.filter;
  return defineSource(async function* (denops, _params, { signal }) {
    const bufinfo = await fn.getbufinfo(denops);
    signal?.throwIfAborted();
    const items = bufinfo
      .filter((v) => v.name !== "")
      .filter((v) => {
        switch (filter) {
          case "buflisted":
            return v.listed;
          case "bufloaded":
            return v.loaded;
          case "bufmodified":
            return v.changed;
          case undefined:
            return true;
          default:
            unreachable(filter);
        }
      })
      .map((v, i) => ({
        id: i,
        value: v.name,
        detail: {
          bufnr: v.bufnr,
          bufname: v.name,
          bufinfo: v,
        },
      }));
    yield* items;
  });
}
