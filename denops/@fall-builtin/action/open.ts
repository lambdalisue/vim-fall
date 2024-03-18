/**
 * Open the selected or cursor item
 *
 * The following variants are available in default:
 *
 * - `edit` (default)
 *
 * @module
 */
import type { Action } from "https://deno.land/x/fall_core@v0.6.0/mod.ts";
import * as buffer from "https://deno.land/x/denops_std@v6.4.0/buffer/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v6.4.0/function/mod.ts";
import { assert, is } from "https://deno.land/x/unknownutil@v3.16.3/mod.ts";

const isOptions = is.StrictOf(is.PartialOf(is.ObjectOf({
  bang: is.Boolean,
  mods: is.String,
  cmdarg: is.String,
  opener: is.String,
  splitter: is.String,
})));

const isPathDetail = is.ObjectOf({
  path: is.String,
  line: is.OptionalOf(is.Number),
  column: is.OptionalOf(is.Number),
});

export function getAction(
  options: Record<string, unknown>,
): Action {
  assert(options, isOptions);
  const bang = options.bang ?? false;
  const mods = options.mods ?? "";
  const cmdarg = options.cmdarg ?? "";
  const firstOpener = options.opener ?? "edit";
  const splitter = options.splitter ?? firstOpener;
  return {
    invoke: async (denops, { cursorItem, selectedItems }) => {
      const items = selectedItems.length > 0
        ? selectedItems
        : cursorItem
        ? [cursorItem]
        : [];
      let opener = firstOpener;
      for (const item of items) {
        if (!isPathDetail(item.detail)) {
          continue;
        }
        try {
          const info = await buffer.open(denops, item.detail.path, {
            bang,
            mods,
            cmdarg,
            opener,
          });
          opener = splitter;
          if (item.detail.line || item.detail.column) {
            const line = item.detail.line ?? 1;
            const column = item.detail.column ?? 1;
            await fn.win_execute(
              denops,
              info.winid,
              `silent! call cursor(${line}, ${column})`,
            );
          }
        } catch (err) {
          // Fail silently
          console.debug(
            `[fall] (action/open) Failed to open ${item.detail.path}:`,
            err,
          );
        }
      }
      return false;
    },
  };
}
