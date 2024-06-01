import type { GetAction } from "jsr:@lambdalisue/vim-fall@0.6.0/action";
import * as buffer from "https://deno.land/x/denops_std@v6.4.0/buffer/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v6.4.0/function/mod.ts";
import { assert, is } from "jsr:@core/unknownutil@3.18.0";

const description = `
Open the cursor item or selected items.

TODO: Better description.
`.trim();

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

export const getAction: GetAction = (denops, options) => {
  assert(options, isOptions);
  const bang = options.bang ?? false;
  const mods = options.mods ?? "";
  const cmdarg = options.cmdarg ?? "";
  const firstOpener = options.opener ?? "edit";
  const splitter = options.splitter ?? firstOpener;
  return {
    description,

    async invoke({ cursorItem, selectedItems }, { signal }) {
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
          signal?.throwIfAborted();

          opener = splitter;
          if (item.detail.line || item.detail.column) {
            const line = item.detail.line ?? 1;
            const column = item.detail.column ?? 1;
            await fn.win_execute(
              denops,
              info.winid,
              `silent! call cursor(${line}, ${column})`,
            );
            await fn.win_execute(
              denops,
              info.winid,
              `silent! normal! zv`,
            );
          }
        } catch (err) {
          const m = err.message ?? err;
          console.warn(`[fall] Failed to open ${item.detail.path}: ${m}`);
        }
      }
      return false;
    },
  };
};
