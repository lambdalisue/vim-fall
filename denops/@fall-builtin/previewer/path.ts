import type { Previewer } from "https://deno.land/x/fall_core@v0.3.0/mod.ts";
import { batch } from "https://deno.land/x/denops_std@v6.3.0/batch/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v6.3.0/function/mod.ts";
import { basename } from "https://deno.land/std@0.218.2/path/basename.ts";
import { assert, is } from "https://deno.land/x/unknownutil@v3.16.3/mod.ts";

const isOptions = is.StrictOf(is.PartialOf(is.ObjectOf({})));

const isPathDetail = is.ObjectOf({
  path: is.String,
  line: is.OptionalOf(is.Number),
  column: is.OptionalOf(is.Number),
});

export function getPreviewer(
  options: Record<string, unknown>,
): Previewer {
  assert(options, isOptions);
  return {
    preview: async (denops, item, { winid }) => {
      if (!isPathDetail(item.detail)) {
        // No preview is available
        return;
      }
      const { line = 1, column = 1 } = item.detail;
      const path = await fn.fnameescape(denops, item.detail.path);
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
          `silent! 0read ${path}`,
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
          `silent! doautocmd <nomodeline> BufRead`,
        );
        await fn.win_execute(
          denops,
          winid,
          `setlocal nomodifiable`,
        );
        await fn.win_execute(denops, winid, `normal! ${line}G${column}|`);
      });
    },
  };
}
