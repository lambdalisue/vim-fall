import type { Denops } from "https://deno.land/x/denops_std@v6.3.0/mod.ts";
import * as buffer from "https://deno.land/x/denops_std@v6.3.0/buffer/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v6.3.0/function/mod.ts";
import { assert, is } from "https://deno.land/x/unknownutil@v3.16.3/mod.ts";

import type { Action } from "../../fall/types.ts";

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

export default function factory(
  _denops: Denops,
  options: Record<string, unknown>,
): Action {
  assert(options, isOptions);
  const bang = options.bang ?? false;
  const mods = options.mods ?? "";
  const cmdarg = options.cmdarg ?? "";
  const opener = options.opener ?? "edit";
  const splitter = options.splitter ?? opener;
  return async (denops, items) => {
    let currentOpener = opener;
    for (const item of items) {
      try {
        if (isPathDetail(item.detail)) {
          const info = await buffer.open(denops, item.detail.path, {
            bang,
            mods,
            cmdarg,
            opener: currentOpener,
          });
          if (item.detail.line || item.detail.column) {
            const line = item.detail.line ?? 1;
            const column = item.detail.column ?? 1;
            await fn.win_execute(
              denops,
              info.winid,
              `silent call cursor(${line}, ${column})`,
            );
          }
        }
        currentOpener = splitter;
      } catch {
        // Fail silently
      }
    }
  };
}
