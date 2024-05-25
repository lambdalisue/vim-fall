import type { Denops } from "https://deno.land/x/denops_std@v6.4.0/mod.ts";
import {
  batch,
  collect,
} from "https://deno.land/x/denops_std@v6.4.0/batch/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v6.4.0/function/mod.ts";
import * as buffer from "https://deno.land/x/denops_std@v6.4.0/buffer/mod.ts";
import * as popup from "https://deno.land/x/denops_std@v6.4.0/popup/mod.ts";

import type { Preview } from "../../extension/mod.ts";

type Context = {
  readonly title: string;
  readonly preview: Preview;
};

export class PreviewComponent implements Disposable {
  readonly #bufnr: number;
  readonly #winid: number;

  constructor(bufnr: number, winid: number) {
    this.#bufnr = bufnr;
    this.#winid = winid;
  }

  async render(
    denops: Denops,
    { preview, title }: Context,
    { signal }: { signal: AbortSignal },
  ): Promise<void> {
    try {
      await popup.config(denops, this.#winid, {
        title: ` ${title} `,
      });
      signal.throwIfAborted();

      await buffer.replace(denops, this.#bufnr, preview.content);
      signal.throwIfAborted();

      const line = preview?.line ?? 1;
      const column = preview?.column ?? 1;
      const filename = preview?.filename;
      await batch(denops, async (denops) => {
        // Clear previous buffer context
        await fn.win_execute(
          denops,
          this.#winid,
          `silent! 0file`,
        );
        await fn.win_execute(
          denops,
          this.#winid,
          `silent! syntax clear`,
        );
        // Change buffer name
        await fn.win_execute(
          denops,
          this.#winid,
          `silent! file fall://preview/${filename ?? ""}`,
        );
        // Apply highlight
        await fn.win_execute(
          denops,
          this.#winid,
          `silent! call fall#internal#preview#highlight()`,
        );
        // Overwrite buffer local options may configured by ftplugin
        await fn.win_execute(
          denops,
          this.#winid,
          `silent! setlocal buftype=nofile bufhidden=wipe nobuflisted noswapfile cursorline nomodifiable nowrap`,
        );
        // Move cursor
        await fn.win_execute(
          denops,
          this.#winid,
          `silent! normal! ${line ?? 1}G${column ?? 1}|`,
        );
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      const m = err.message ?? err;
      console.warn(
        `[fall] Failed to render the preview component: ${m}`,
      );
    }
  }

  async moveCursor(
    denops: Denops,
    offset: number,
    { signal }: { signal: AbortSignal },
  ): Promise<void> {
    try {
      const [line, linecount] = await collect(denops, (denops) => [
        fn.line(denops, ".", this.#winid),
        fn.line(denops, "$", this.#winid),
      ]);
      signal.throwIfAborted();

      const newLine = Math.max(1, Math.min(line + offset, linecount));
      await fn.win_execute(
        denops,
        this.#winid,
        `normal! ${newLine}G`,
      );
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      const m = err.message ?? err;
      console.warn(
        `[fall] Failed to move cursor on the preview window: ${m}`,
      );
    }
  }

  async moveCursorAt(
    denops: Denops,
    line: number,
    { signal }: { signal: AbortSignal },
  ): Promise<void> {
    try {
      const linecount = await fn.line(denops, "$", this.#winid);
      signal.throwIfAborted();

      const newLine = Math.max(1, Math.min(line, linecount));
      await fn.win_execute(
        denops,
        this.#winid,
        `normal! ${newLine}G`,
      );
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      const m = err.message ?? err;
      console.debug(
        `[fall] Failed to move cursor on the preview window: ${m}`,
      );
    }
  }

  [Symbol.dispose]() {
    // Do nothing
  }
}
