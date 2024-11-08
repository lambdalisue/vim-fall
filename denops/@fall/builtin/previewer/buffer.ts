import * as fn from "jsr:@denops/std@^7.3.0/function";
import { collect } from "jsr:@denops/std@^7.3.0/batch";
import { basename } from "jsr:@std/path@^1.0.0/basename";

import { definePreviewer, type Previewer } from "../../previewer.ts";

type Detail = {
  bufnr: number;
  line?: number;
  column?: number;
};

export function buffer<T extends Detail>(): Previewer<T> {
  return definePreviewer<T>(async (denops, { item }, { signal }) => {
    const [bufloaded, bufname, content] = await collect(denops, (denops) => [
      fn.bufloaded(denops, item.detail.bufnr),
      fn.bufname(denops, item.detail.bufnr),
      fn.getbufline(denops, item.detail.bufnr, 1, "$"),
    ]);
    signal?.throwIfAborted();

    if (!bufloaded) {
      return;
    }
    const { line, column } = item.detail;
    return {
      content,
      line,
      column,
      filename: basename(bufname),
    };
  });
}
