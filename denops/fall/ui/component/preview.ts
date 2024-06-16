import type { Denops } from "https://deno.land/x/denops_std@v6.4.0/mod.ts";
import {
  batch,
  collect,
} from "https://deno.land/x/denops_std@v6.4.0/batch/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v6.4.0/function/mod.ts";
import * as buffer from "https://deno.land/x/denops_std@v6.4.0/buffer/mod.ts";
import * as popup from "https://deno.land/x/denops_std@v6.4.0/popup/mod.ts";
import { equal } from "jsr:@std/assert@0.225.1/equal";

import type { Preview } from "../../extension/mod.ts";
import { BaseComponent, type as BaseParams } from "./base.ts";

type Params = BaseParams & {
  readonly mode?: "fast" | "correct";
};

export class PreviewComponent extends BaseComponent {
  protected readonly name = "preview";
  readonly #mode: "fast" | "correct";

  #modified = true;
  #title = "";
  #preview: Preview = {
    content: ["No preview is available"],
  };

  constructor(params: Params) {
    super(params);
    this.#mode = params.mode ?? "fast";
  }

  get title(): string {
    return this.#title;
  }

  set title(value: string) {
    if (this.#title === value) return;
    this.#title = value;
    this.#modified = true;
  }

  get preview(): Preview {
    return this.#preview;
  }

  set preview(value: Preview) {
    if (equal(this.#preview, value)) return;
    this.#preview = value;
    this.#modified = true;
  }

  async render(
    denops: Denops,
    { signal }: { signal: AbortSignal },
  ): Promise<void | true> {
    if (!this.window) {
      return true;
    }
    const { winid, bufnr } = this.window;
    if (!this.#modified) {
      return true;
    }
    this.#modified = false;
    try {
      await popup.config(denops, winid, {
        title: ` ${this.#title} `,
      });
      signal.throwIfAborted();

      await buffer.replace(denops, bufnr, this.#preview.content);
      signal.throwIfAborted();

      const line = this.#preview?.line ?? 1;
      const column = this.#preview?.column ?? 1;
      const filename = this.#preview?.filename ?? "";
      const filetype = this.#preview?.filetype ?? "";
      await batch(denops, async (denops) => {
        // Clear previous buffer context
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
        // Change buffer name and reset options
        await fn.win_execute(
          denops,
          winid,
          `silent! file fall://preview/${filename}`,
        );
        await fn.win_execute(
          denops,
          winid,
          `silent! setlocal winfixbuf winfixwidth winfixheight`,
        );
        // Apply highlight
        await fn.win_execute(
          denops,
          winid,
          this.#mode === "fast"
            ? `call fall#internal#highlight#fast('${filetype}')`
            : `call fall#internal#highlight#correct('${filetype}')`,
        );
        // Overwrite buffer local options may configured by ftplugin
        await fn.win_execute(
          denops,
          winid,
          `silent! setlocal buftype=nofile bufhidden=wipe nobuflisted noswapfile nomodifiable nowrap cursorline`,
        );
        // Move cursor
        await fn.win_execute(
          denops,
          winid,
          `silent! normal! ${line ?? 1}G${column ?? 1}|`,
        );
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      const m = err.message ?? err;
      console.warn(`[fall] Failed to render the preview window: ${m}`);
    }
  }

  async moveCursor(
    denops: Denops,
    offset: number,
    { signal }: { signal: AbortSignal },
  ): Promise<void> {
    if (!this.window) {
      return;
    }
    const { winid } = this.window;
    try {
      const [line, linecount] = await collect(denops, (denops) => [
        fn.line(denops, ".", winid),
        fn.line(denops, "$", winid),
      ]);
      signal.throwIfAborted();

      const newLine = Math.max(1, Math.min(line + offset, linecount));
      await batch(denops, async (denops) => {
        await fn.win_execute(
          denops,
          winid,
          `silent! normal! ${newLine}G`,
        );
        await denops.cmd("redraw");
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      const m = err.message ?? err;
      console.warn(`[fall] Failed to move cursor on the preview window: ${m}`);
    }
  }

  async moveCursorH(
    denops: Denops,
    offset: number,
    _options: { signal: AbortSignal },
  ): Promise<void> {
    if (!this.window) {
      return;
    }
    const { winid } = this.window;
    try {
      await batch(denops, async (denops) => {
        if (offset > 0) {
          await fn.win_execute(
            denops,
            winid,
            `silent! normal! ${offset}zl`,
          );
        } else {
          await fn.win_execute(
            denops,
            winid,
            `silent! normal! ${offset * -1}zh`,
          );
        }
        await denops.cmd("redraw");
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      const m = err.message ?? err;
      console.warn(`[fall] Failed to move cursor on the preview window: ${m}`);
    }
  }

  async moveCursorAt(
    denops: Denops,
    line: number,
    { signal }: { signal: AbortSignal },
  ): Promise<void> {
    if (!this.window) {
      return;
    }
    const { winid } = this.window;
    try {
      const linecount = await fn.line(denops, "$", winid);
      signal.throwIfAborted();

      const newLine = Math.max(1, Math.min(line, linecount));
      await batch(denops, async (denops) => {
        await fn.win_execute(
          denops,
          winid,
          `silent! normal! ${newLine}G`,
        );
        await denops.cmd("redraw");
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      const m = err.message ?? err;
      console.debug(`[fall] Failed to move cursor on the preview window: ${m}`);
    }
  }
}
