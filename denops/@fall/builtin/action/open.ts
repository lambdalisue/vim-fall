import * as buffer from "jsr:@denops/std@^7.0.0/buffer";
import * as fn from "jsr:@denops/std@^7.0.0/function";

import { type Action, defineAction } from "../../action.ts";

type Options = {
  bang?: boolean;
  mods?: string;
  cmdarg?: string;
  opener?: string;
  splitter?: string;
};

type Detail = {
  path: string;
  line?: number;
  column?: number;
} | {
  bufname: string;
  line?: number;
  column?: number;
};

export function open<T extends Detail>(options: Options = {}): Action<T> {
  const bang = options.bang ?? false;
  const mods = options.mods ?? "";
  const cmdarg = options.cmdarg ?? "";
  const opener = options.opener ?? "edit";
  const splitter = options.splitter ?? opener;
  return defineAction(async (denops, { item, selectedItems }, { signal }) => {
    const items = selectedItems ?? [item];
    let currentOpener = opener;
    for (const item of items.filter((v) => !!v)) {
      const expr = "bufname" in item.detail
        ? item.detail.bufname
        : item.detail.path;
      const info = await buffer.open(denops, expr, {
        bang,
        mods,
        cmdarg,
        opener: currentOpener,
      });
      signal?.throwIfAborted();

      currentOpener = splitter;
      if (item.detail.line || item.detail.column) {
        const line = item.detail.line ?? 1;
        const column = item.detail.column ?? 1;
        await fn.win_execute(
          denops,
          info.winid,
          `silent! normal! ${line}G${column}|zv`,
        );
      }
    }
  });
}

export const defaultOpenActions: {
  open: Action<Detail>;
  "open:split": Action<Detail>;
  "open:vsplit": Action<Detail>;
  "open:tabedit": Action<Detail>;
  "open:drop": Action<Detail>;
} = {
  open: open(),
  "open:split": open({ opener: "split" }),
  "open:vsplit": open({ opener: "vsplit" }),
  "open:tabedit": open({ opener: "tabedit" }),
  "open:drop": open({ opener: "drop" }),
};
