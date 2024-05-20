import type { GetPreviewer } from "../../@fall/previewer.ts";
import { batch } from "https://deno.land/x/denops_std@v6.4.0/batch/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v6.4.0/function/mod.ts";
import * as buffer from "https://deno.land/x/denops_std@v6.4.0/buffer/mod.ts";
import { assert, is, maybe } from "jsr:@core/unknownutil@3.18.0";

const isOptions = is.StrictOf(is.PartialOf(is.ObjectOf({
  contentAttribute: is.String,
  lineAttribute: is.String,
  columnAttribute: is.String,
})));

export const getPreviewer: GetPreviewer = (denops, options) => {
  assert(options, isOptions);
  const contentAttribute = options.contentAttribute ?? "content";
  const lineAttribute = options.lineAttribute ?? "line";
  const columnAttribute = options.columnAttribute ?? "column";
  return {
    async preview({ item, bufnr, winid }, { signal }) {
      const content = maybe(item.detail[contentAttribute], is.String);
      if (!content) {
        // Try next previewer
        return true;
      }

      const line = maybe(item.detail[lineAttribute], is.Number) ?? 1;
      const column = maybe(item.detail[columnAttribute], is.Number) ?? 1;
      const width = await fn.winwidth(denops, winid);
      signal?.throwIfAborted();

      const wrap = (s: string) =>
        s.replace(
          new RegExp(`(?![^\\n]{1,${width}}$)([^\\n]{1,${width}})\\s`, "g"),
          "$1\n",
        );
      await buffer.replace(denops, bufnr, wrap(content).split("\n"));
      signal?.throwIfAborted();

      await batch(denops, async (denops) => {
        await fn.win_execute(
          denops,
          winid,
          `silent! 0file`,
        );
        await fn.win_execute(
          denops,
          winid,
          `silent! syntax clear`,
        );
        await fn.win_execute(
          denops,
          winid,
          `silent! file fall://preview/${name}`,
        );
        await fn.win_execute(
          denops,
          winid,
          `silent! normal! ${line}G${column}|`,
        );
      });
    },
  };
};
