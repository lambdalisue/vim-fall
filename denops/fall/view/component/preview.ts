import type { Denops } from "https://deno.land/x/denops_std@v6.4.0/mod.ts";
import { collect } from "https://deno.land/x/denops_std@v6.4.0/batch/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v6.4.0/function/mod.ts";
import * as buffer from "https://deno.land/x/denops_std@v6.4.0/buffer/mod.ts";

import type { Previewer, PreviewerItem } from "../../extension/type.ts";

export type Params = Readonly<{
  previewers?: readonly Previewer[];
}>;

/**
 * Preview component that shows preview content of the cursor item
 */
export class PreviewComponent {
  #bufnr: number;
  #winid: number;
  #previewers: readonly Previewer[];

  constructor(
    bufnr: number,
    winid: number,
    params: Params,
  ) {
    this.#bufnr = bufnr;
    this.#winid = winid;
    this.#previewers = params.previewers ?? [];
  }

  async render(
    denops: Denops,
    item: PreviewerItem | undefined,
    { signal }: { signal: AbortSignal },
  ): Promise<void> {
    try {
      // Overwrite buffer local options may configured by ftplugin
      await fn.win_execute(
        denops,
        this.#winid,
        `setlocal buftype=nofile bufhidden=wipe nobuflisted noswapfile cursorline nomodifiable nowrap`,
      );
      signal.throwIfAborted();

      if (!item) {
        await buffer.replace(denops, this.#bufnr, [
          "No preview item is available",
        ]);
        return;
      }

      const params = {
        item,
        bufnr: this.#bufnr,
        winid: this.#winid,
      };
      let previewed = false;
      for (const previewer of this.#previewers) {
        if (await previewer.preview(params, { signal })) {
          signal.throwIfAborted();
          continue;
        }
        previewed = true;
        break;
      }
      signal.throwIfAborted();

      if (previewed) {
        await fn.win_execute(
          denops,
          this.#winid,
          `silent! call fall#internal#preview#highlight()`,
        );
      } else {
        await buffer.replace(denops, this.#bufnr, [
          "No preview is available",
        ]);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      const m = err.message ?? err;
      console.warn(
        `[fall] Failed to render the preview component: ${m}`,
      );
    }
  }

  /**
   * Move the cursor in the preview window.
   */
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

  /**
   * Move the cursor at in the preview window.
   */
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
}
