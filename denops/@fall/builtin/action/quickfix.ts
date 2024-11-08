import * as fn from "jsr:@denops/std@^7.0.0/function";

import { type Action, defineAction } from "../../action.ts";

type What = {
  context?: unknown;
  id?: number;
  idx?: number | string;
  nr?: number;
  title?: string;
};

type Options = {
  what?: What;
  action?: "a" | "r" | "f" | " ";
  after?: string;
};

type Detail = {
  path: string;
  line?: number;
  column?: number;
  length?: number;
  context?: string;
} | {
  bufname: string;
  line?: number;
  column?: number;
  length?: number;
  context?: string;
};

export function quickfix<T extends Detail>(
  options: Options = {},
): Action<T> {
  const what = options.what ?? {};
  const action = options.action ?? " ";
  const after = options.after ?? "copen";
  return defineAction<T>(
    async (denops, { selectedItems, filteredItems }, { signal }) => {
      const source = selectedItems ?? filteredItems;
      const items = source
        .map((item) => {
          const filename = "bufname" in item.detail
            ? item.detail.bufname
            : item.detail.path;
          return {
            filename,
            lnum: item.detail.line,
            col: item.detail.column,
            end_col: item.detail.column && item.detail.length
              ? item.detail.column + item.detail.length
              : undefined,
            text: item.detail.context,
          };
        });
      signal?.throwIfAborted();
      await fn.setqflist(denops, [], action, {
        ...what,
        items,
      });
      if (after) {
        signal?.throwIfAborted();
        await denops.cmd(after);
      }
    },
  );
}

export const defaultQuickfixActions: {
  quickfix: Action<Detail>;
} = {
  quickfix: quickfix(),
};
