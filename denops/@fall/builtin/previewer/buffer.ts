import type { Denops } from "jsr:@denops/std@^7.3.0";
import * as fn from "jsr:@denops/std@^7.3.0/function";
import { collect } from "jsr:@denops/std@^7.3.0/batch";
import { basename } from "jsr:@std/path@^1.0.0/basename";

import type { PreviewItem } from "../../item.ts";
import type { Previewer, PreviewParams } from "../../previewer.ts";

type Detail = {
  bufnr: number;
  line?: number;
  column?: number;
};

/**
 * A previewer to preview buffer.
 */
export class BufferPreviewer<T extends Detail> implements Previewer<T> {
  async preview(
    denops: Denops,
    { item }: PreviewParams<T>,
    { signal }: { signal?: AbortSignal },
  ): Promise<PreviewItem | void> {
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
  }
}
