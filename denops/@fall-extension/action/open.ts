import type { GetAction } from "jsr:@lambdalisue/vim-fall@^0.6.0/action";
import * as buffer from "jsr:@denops/std@^7.0.0/buffer";
import * as fn from "jsr:@denops/std@^7.0.0/function";
import { as, assert, is } from "jsr:@core/unknownutil@^4.0.0";

const isOptions = is.StrictOf(is.PartialOf(is.ObjectOf({
  bang: is.Boolean,
  mods: is.String,
  cmdarg: is.String,
  opener: is.String,
  splitter: is.String,
})));

const isPathDetail = is.ObjectOf({
  path: is.String,
  line: as.Optional(is.Number),
  column: as.Optional(is.Number),
});

export const getAction: GetAction = (denops, options) => {
  assert(options, isOptions);
  const bang = options.bang ?? false;
  const mods = options.mods ?? "";
  const cmdarg = options.cmdarg ?? "";
  const firstOpener = options.opener ?? "edit";
  const splitter = options.splitter ?? firstOpener;
  return {
    description:
      "Open the cursor item or selected items with the specified opener",

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
