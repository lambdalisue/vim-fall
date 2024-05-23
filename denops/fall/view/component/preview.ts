import type { Denops } from "https://deno.land/x/denops_std@v6.4.0/mod.ts";
import {
  batch,
  collect,
} from "https://deno.land/x/denops_std@v6.4.0/batch/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v6.4.0/function/mod.ts";
import * as buffer from "https://deno.land/x/denops_std@v6.4.0/buffer/mod.ts";
import * as popup from "https://deno.land/x/denops_std@v6.4.0/popup/mod.ts";
import { equal } from "jsr:@std/assert@0.225.2/equal";

import type {
  PreviewContent,
  Previewer,
  PreviewerItem,
} from "../../extension/type.ts";

export type Params = Readonly<{
  previewers?: readonly Previewer[];
}>;

/**
 * Preview component that shows preview content of the cursor item
 */
export class PreviewComponent implements Disposable {
  readonly #bufnr: number;
  readonly #winid: number;
  readonly #previewers: readonly Previewer[];

  #previous?: {
    item: PreviewerItem;
    index: number;
  };
  #previewerIndex = 0;

  constructor(
    bufnr: number,
    winid: number,
    params: Params,
  ) {
    this.#bufnr = bufnr;
    this.#winid = winid;
    this.#previewers = params.previewers ?? [];
  }

  get #previewer(): Previewer {
    return this.#previewers[this.#previewerIndex];
  }

  get previewerIndex(): number {
    return this.#previewerIndex;
  }

  set previewerIndex(value: number) {
    if (value < 0) {
      this.#previewerIndex = 0;
    } else if (value >= this.#previewers.length) {
      this.#previewerIndex = this.#previewers.length - 1;
    } else {
      this.#previewerIndex = value;
    }
  }

  async render(
    denops: Denops,
    item: PreviewerItem | undefined,
    { signal }: { signal: AbortSignal },
  ): Promise<void> {
    if (!item || equal({ item, index: this.#previewerIndex }, this.#previous)) {
      return;
    }
    this.#previous = {
      item,
      index: this.#previewerIndex,
    };

    try {
      await popup.config(denops, this.#winid, {
        title: ` ${this.#previewerIndex + 1}.${this.#previewer.name} `,
      });
      signal.throwIfAborted();

      if (!item) {
        await buffer.replace(denops, this.#bufnr, [
          "No preview item is available",
        ]);
        return;
      }

      const [winwidth, winheight] = await collect(denops, (denops) => [
        fn.winwidth(denops, this.#winid),
        fn.winheight(denops, this.#winid),
      ]);
      signal.throwIfAborted();

      const previewContent = await this.#previewer.preview({
        item,
        width: winwidth,
        height: winheight,
      }, {
        signal,
      });
      signal.throwIfAborted();
      const content = previewContent?.content ?? [
        "No previewer is available for the item.",
      ];
      const line = previewContent?.line ?? 1;
      const column = previewContent?.column ?? 1;
      const filename = previewContent?.filename;

      await buffer.replace(denops, this.#bufnr, content);
      signal.throwIfAborted();

      await batch(denops, async (denops) => {
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
        await fn.win_execute(
          denops,
          this.#winid,
          `silent! file fall://preview/${filename ?? ""}`,
        );
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

  [Symbol.dispose]() {
    // Do nothing
  }
}
