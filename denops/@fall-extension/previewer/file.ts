import type { GetPreviewer } from "../../@fall/previewer.ts";
import { batch } from "https://deno.land/x/denops_std@v6.4.0/batch/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v6.4.0/function/mod.ts";
import { basename } from "jsr:@std/path@0.225.0/basename";
import { assert, is, maybe } from "jsr:@core/unknownutil@3.18.0";

const isOptions = is.StrictOf(is.PartialOf(is.ObjectOf({
  pathAttribute: is.String,
  lineAttribute: is.String,
  columnAttribute: is.String,
})));

export const getPreviewer: GetPreviewer = (denops, options) => {
  assert(options, isOptions);
  const pathAttribute = options.pathAttribute ?? "path";
  const lineAttribute = options.lineAttribute ?? "line";
  const columnAttribute = options.columnAttribute ?? "column";
  return {
    async preview({ item, winid }, { signal }) {
      const path = maybe(item.detail[pathAttribute], is.String);
      if (!path) {
        // Try next previewer
        return true;
      }

      const line = maybe(item.detail[lineAttribute], is.Number) ?? 1;
      const column = maybe(item.detail[columnAttribute], is.Number) ?? 1;
      const escapedPath = await fn.fnameescape(denops, path);
      signal?.throwIfAborted();

      await batch(denops, async (denops) => {
        await fn.win_execute(
          denops,
          winid,
          `setlocal modifiable`,
        );
        await fn.win_execute(
          denops,
          winid,
          `silent! 0,$delete _`,
        );
        await fn.win_execute(
          denops,
          winid,
          `silent! 0read ${escapedPath}`,
        );
        await fn.win_execute(
          denops,
          winid,
          `silent! $delete _`,
        );
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
          `silent! file fall://preview/${basename(path)}`,
        );
        await fn.win_execute(
          denops,
          winid,
          `setlocal nomodifiable`,
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
