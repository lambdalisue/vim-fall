import type { Denops } from "https://deno.land/x/denops_std@v6.4.0/mod.ts";
import {
  batch,
  collect,
} from "https://deno.land/x/denops_std@v6.4.0/batch/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v6.4.0/function/mod.ts";
import * as buffer from "https://deno.land/x/denops_std@v6.4.0/buffer/mod.ts";

import type { Previewer, PreviewerItem } from "../../extension/type.ts";

export type PreviewComponentParams = Readonly<{
  previewers?: readonly Previewer[];
}>;

/**
 * A component that renders a preview window.
 */
export class PreviewComponent {
  #bufnr: number;
  #winid: number;
  #previewers: readonly Previewer[];

  constructor(
    bufnr: number,
    winid: number,
    params: PreviewComponentParams,
  ) {
    this.#bufnr = bufnr;
    this.#winid = winid;
    this.#previewers = params.previewers ?? [];
  }

  /**
   * Render the preview window.
   *
   * It returns true if the preview window is rendered.
   */
  async render(
    denops: Denops,
    item: PreviewerItem | undefined,
    options: { signal: AbortSignal },
  ): Promise<void> {
    try {
      await this.#render(denops, item, options);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      const m = err.message ?? err;
      console.warn(
        `[fall] Failed to render the preview component: ${m}`,
      );
    }
  }

  async #render(
    denops: Denops,
    item: PreviewerItem | undefined,
    { signal }: { signal: AbortSignal },
  ): Promise<void> {
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
        continue;
      }
      previewed = true;
      break;
    }
    if (previewed) {
      await fn.win_execute(
        denops,
        this.#winid,
        `silent! filetype detect`,
      );
    } else {
      await buffer.replace(denops, this.#bufnr, [
        "No preview is available",
      ]);
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
      if (signal.aborted) return;

      const newLine = Math.max(1, Math.min(line + offset, linecount));
      await fn.win_execute(
        denops,
        this.#winid,
        `normal! ${newLine}G`,
      );
    } catch (err) {
      // Fail silently
      const m = err.message ?? err;
      console.debug(
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
      if (signal.aborted) return;

      const newLine = Math.max(1, Math.min(line, linecount));
      await batch(denops, async (denops) => {
        await fn.win_execute(
          denops,
          this.#winid,
          `normal! ${newLine}G`,
        );
        await denops.cmd("redraw");
      });
    } catch (err) {
      // Fail silently
      const m = err.message ?? err;
      console.debug(
        `[fall] Failed to move cursor on the preview window: ${m}`,
      );
    }
  }
}
