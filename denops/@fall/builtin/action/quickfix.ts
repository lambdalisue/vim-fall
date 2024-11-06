import type { Denops } from "jsr:@denops/std@^7.3.0";
import * as fn from "jsr:@denops/std@^7.0.0/function";

import type { Action, InvokeParams } from "../../action.ts";

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

export class QuickfixAction<T extends Detail> implements Action<T> {
  #what: What;
  #action: "a" | "r" | "f" | " ";
  #after: string;

  constructor(options: Options = {}) {
    this.#what = options.what ?? {};
    this.#action = options.action ?? " ";
    this.#after = options.after ?? "";
  }

  async invoke(
    denops: Denops,
    { selectedItems, filteredItems }: InvokeParams<T>,
    { signal }: { signal?: AbortSignal },
  ): Promise<void> {
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
    try {
      signal?.throwIfAborted();
      await fn.setqflist(denops, [], this.#action, {
        ...this.#what,
        items,
      });
      if (this.#after) {
        signal?.throwIfAborted();
        await denops.cmd(this.#after);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      const m = err instanceof Error ? err.message : String(err);
      console.warn(`[fall] Failed to set quickfix list: ${m}`);
    }
  }
}

export const quickfixAction: { quickfix: QuickfixAction<Detail> } = {
  quickfix: new QuickfixAction({
    after: "copen",
  }),
};
