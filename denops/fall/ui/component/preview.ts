import type { Denops } from "https://deno.land/x/denops_std@v6.3.0/mod.ts";
import { batch } from "https://deno.land/x/denops_std@v6.3.0/batch/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v6.3.0/function/mod.ts";
import { basename } from "https://deno.land/std@0.218.2/path/basename.ts";

export class PreviewComponent {
  #winid: number;
  #debounceWait: number;
  #lineMax: number = 1;

  #changedAt: number | undefined;
  #changed: boolean = false;
  #line: number = 1;
  #path: string | undefined;

  constructor(
    _bufnr: number,
    winid: number,
    { debounceWait }: { debounceWait: number },
  ) {
    this.#winid = winid;
    this.#debounceWait = debounceWait;
  }

  get line(): number {
    return this.#line;
  }

  set line(value: number) {
    // NOTE: Do NOT check #lineMax here because it may not be updated yet.
    value = Math.max(1, value);
    const changed = this.#line !== value;
    this.#changed = this.#changed || changed;
    this.#line = value;
    if (changed) {
      this.#changedAt = performance.now();
    }
  }

  get path(): string | undefined {
    return this.#path;
  }

  set path(value: string | undefined) {
    const changed = this.#path !== value;
    this.#changed = this.#changed || changed;
    this.#path = value;
    if (changed) {
      this.#changedAt = performance.now();
    }
  }

  forceImmediateUpdate(): void {
    // Force immediate update
    this.#changed = true;
    this.#changedAt = performance.now() - this.#debounceWait;
  }

  async render(
    denops: Denops,
    { signal: _signal }: { signal: AbortSignal },
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
    const path = this.#path
      ? await fn.fnameescape(denops, this.#path)
      : "fall://preview-blank";
    await batch(denops, async (denops) => {
      await fn.win_execute(
        denops,
        this.#winid,
        `silent! 0,$delete _`,
      );
      await fn.win_execute(
        denops,
        this.#winid,
        `silent! 0read ++edit ${path}`,
      );
      await fn.win_execute(
        denops,
        this.#winid,
        `silent! 0file`,
      );
      await fn.win_execute(
        denops,
        this.#winid,
        `silent! file fall://preview/${basename(path)}`,
      );
      await fn.win_execute(
        denops,
        this.#winid,
        `setlocal buftype=nofile bufhidden=wipe nobuflisted noswapfile cursorline`,
      );
      await fn.win_execute(denops, this.#winid, `silent! filetype detect`);
      await fn.win_execute(denops, this.#winid, `normal! ${this.line}G`);
    });
    this.#lineMax = await fn.line(denops, "$", this.#winid);
    this.#line = Math.min(this.#line, this.#lineMax);
    return true;
  }
}
