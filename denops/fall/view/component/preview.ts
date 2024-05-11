import type { Denops } from "https://deno.land/x/denops_std@v6.4.0/mod.ts";
import {
  batch,
  collect,
} from "https://deno.land/x/denops_std@v6.4.0/batch/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v6.4.0/function/mod.ts";
import * as buffer from "https://deno.land/x/denops_std@v6.4.0/buffer/mod.ts";
import type {
  Previewer,
  PreviewerItem,
} from "https://deno.land/x/fall_core@v0.11.0/mod.ts";
import { equal } from "jsr:@std/assert@0.225.1/equal";

const DEFAULT_DEBOUNCE_WAIT = 100;

export interface PreviewComponentParams {
  previewers?: Previewer[];
  debounceWait?: number;
}

/**
 * A component that renders a preview window.
 */
export class PreviewComponent {
  #bufnr: number;
  #winid: number;
  #previewers: Previewer[];
  #debounceWait: number;

  #changedAt: number | undefined;
  #changed: boolean = false;
  #item?: PreviewerItem;

  constructor(
    bufnr: number,
    winid: number,
    params: PreviewComponentParams,
  ) {
    this.#bufnr = bufnr;
    this.#winid = winid;
    this.#previewers = params.previewers ?? [];
    this.#debounceWait = params.debounceWait ?? DEFAULT_DEBOUNCE_WAIT;
  }

  /**
   * Set the previewer item to be rendered.
   */
  set item(value: PreviewerItem | undefined) {
    const changed = !equal(this.#item, value);
    this.#changed = this.#changed || changed;
    this.#item = value;
    if (changed) {
      this.#changedAt = performance.now();
    }
  }

  /**
   * Render the preview window.
   *
   * It returns true if the preview window is rendered.
   */
  async render(
    denops: Denops,
    { signal }: { signal: AbortSignal },
  ): Promise<boolean> {
    if (!this.#changed) return false;
    if (
      !this.#changedAt ||
      performance.now() - this.#changedAt < this.#debounceWait
    ) {
      return false;
    }
    this.#changed = false;
    this.#changedAt = undefined;

    // Render UI
    try {
      if (this.#item) {
        const target = {
          bufnr: this.#bufnr,
          winid: this.#winid,
        };
        // Overwrite buffer local options may configured by ftplugin
        await fn.win_execute(
          denops,
          this.#winid,
          `setlocal buftype=nofile bufhidden=wipe nobuflisted noswapfile cursorline nomodifiable nowrap`,
        );
        for (const previewer of this.#previewers) {
          if (
            await previewer.preview({ item: this.#item, ...target }, { signal })
          ) {
            continue;
          }
          break;
        }
        await fn.win_execute(
          denops,
          this.#winid,
          `silent! filetype detect`,
        );
      } else if (!this.#item) {
        await buffer.replace(denops, this.#bufnr, ["No preview is available"]);
      } else {
        await buffer.replace(denops, this.#bufnr, [
          "Previewer is not available",
        ]);
      }
    } catch (err) {
      // Fail silently
      console.debug(
        `[fall] Failed to render content to the preview window: ${err}`,
      );
    }
    return true;
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
      console.debug(
        `[fall] Failed to move cursor on the preview window: ${err}`,
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
      console.debug(
        `[fall] Failed to move cursor on the preview window: ${err}`,
      );
    }
  }
}
