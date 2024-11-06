import type { Denops } from "jsr:@denops/std@^7.3.0";
import * as buffer from "jsr:@denops/std@^7.0.0/buffer";
import * as fn from "jsr:@denops/std@^7.0.0/function";

import type { Action, InvokeParams } from "../../action.ts";

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

export class OpenAction<T extends Detail> implements Action<T> {
  #bang: boolean;
  #mods: string;
  #cmdarg: string;
  #opener: string;
  #splitter: string;

  constructor(options: Options = {}) {
    this.#bang = options.bang ?? false;
    this.#mods = options.mods ?? "";
    this.#cmdarg = options.cmdarg ?? "";
    this.#opener = options.opener ?? "edit";
    this.#splitter = options.splitter ?? this.#opener;
  }

  async invoke(
    denops: Denops,
    { item, selectedItems }: InvokeParams<T>,
    { signal }: { signal?: AbortSignal },
  ): Promise<void> {
    const items = selectedItems ?? [item];
    let opener = this.#opener;
    for (const item of items.filter((v) => !!v)) {
      const expr = "bufname" in item.detail
        ? item.detail.bufname
        : item.detail.path;
      try {
        const info = await buffer.open(denops, expr, {
          bang: this.#bang,
          mods: this.#mods,
          cmdarg: this.#cmdarg,
          opener,
        });
        signal?.throwIfAborted();

        opener = this.#splitter;
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
        if (err instanceof DOMException && err.name === "AbortError") return;
        const m = err instanceof Error ? err.message : String(err);
        console.warn(`[fall] Failed to open ${expr}: ${m}`);
      }
    }
  }
}

export const openActions: {
  open: OpenAction<Detail>;
  "open:drop": OpenAction<Detail>;
  "open:split": OpenAction<Detail>;
  "open:vsplit": OpenAction<Detail>;
  "open:tabedit": OpenAction<Detail>;
} = {
  open: new OpenAction(),
  "open:drop": new OpenAction({ opener: "drop" }),
  "open:split": new OpenAction({ opener: "split" }),
  "open:vsplit": new OpenAction({ opener: "vsplit" }),
  "open:tabedit": new OpenAction({ opener: "tabedit" }),
};
