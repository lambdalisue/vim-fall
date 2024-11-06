import type { Denops } from "jsr:@denops/std@^7.3.0";
import * as fn from "jsr:@denops/std@^7.3.0/function";
import { isAbsolute } from "jsr:@std/path@^1.0.0/is-absolute";
import { basename } from "jsr:@std/path@^1.0.0/basename";

import type { PreviewItem } from "../../item.ts";
import type { Previewer, PreviewParams } from "../../previewer.ts";
import { splitText } from "../_util.ts";

const decoder = new TextDecoder("utf-8", { fatal: true });

type Detail = {
  path: string;
  line?: number;
  column?: number;
};
/**
 * A previewer to preview file.
 */
export class FilePreviewer<T extends Detail> implements Previewer<T> {
  async preview(
    denops: Denops,
    { item }: PreviewParams<T>,
    { signal }: { signal?: AbortSignal },
  ): Promise<PreviewItem> {
    const abspath = isAbsolute(item.detail.path)
      ? item.detail.path
      : await fn.fnamemodify(denops, item.detail.path, ":p");
    signal?.throwIfAborted();

    try {
      const data = await Deno.readFile(abspath, { signal });
      signal?.throwIfAborted();
      const text = decoder.decode(data);
      return {
        content: splitText(text),
        line: item.detail.line,
        column: item.detail.column,
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
      return {
        content: String(err).split("\n"),
      };
    }
  }
}
