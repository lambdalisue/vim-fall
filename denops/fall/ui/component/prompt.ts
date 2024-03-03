import type { Denops } from "https://deno.land/x/denops_std@v6.3.0/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v6.3.0/function/mod.ts";
import * as buffer from "https://deno.land/x/denops_std@v6.3.0/buffer/mod.ts";
import { collect } from "https://deno.land/x/denops_std@v6.3.0/batch/mod.ts";
import { input } from "https://deno.land/x/denops_std@v6.3.0/helper/input.ts";
import { send } from "https://deno.land/x/denops_std@v6.3.0/helper/keymap.ts";
import { exprQuote as q } from "https://deno.land/x/denops_std@v6.3.0/helper/expr_string.ts";

import { AsyncScheduler } from "../../util/async_scheduler.ts";

const HEADER = "> ";
const OBSERVER_INTERVAL = 10;

export interface StartOptions {
  signal?: AbortSignal;
}

export class PromptComponent {
  #bufnr: number;
  #changed: boolean = false;
  #cmdline: string = "";
  #cmdpos: number = 0;

  constructor(bufnr: number, _winid: number) {
    this.#bufnr = bufnr;
  }

  get header(): string {
    return HEADER;
  }

  get cmdline(): string {
    return this.#cmdline;
  }

  set cmdline(value: string) {
    const changed = this.#cmdline !== value;
    this.#changed = this.#changed || changed;
    this.#cmdline = value;
  }

  get cmdpos(): number {
    return this.#cmdpos;
  }

  set cmdpos(value: number) {
    const changed = this.#cmdpos !== value;
    this.#changed = this.#changed || changed;
    this.#cmdpos = value;
  }

  async render(
    denops: Denops,
    { signal: _signal }: { signal: AbortSignal },
  ): Promise<boolean> {
    if (!this.#changed) return false;
    this.#changed = false;

    // Render UI
    try {
      await buffer.undecorate(denops, this.#bufnr);
      await buffer.replace(denops, this.#bufnr, [HEADER + this.#cmdline + " "]);
      await buffer.decorate(denops, this.#bufnr, [
        {
          line: 1,
          column: 1,
          length: HEADER.length,
          highlight: "FallPromptHeader",
        },
        {
          line: 1,
          column: Math.max(1, HEADER.length + this.#cmdpos),
          length: 1,
          highlight: "FallPromptCursor",
        },
      ]);
    } catch {
      // Fail silently
    }
    return true;
  }

  async start(
    denops: Denops,
    { signal }: StartOptions = {},
  ): Promise<boolean> {
    const closeInput = async () => {
      try {
        await send(denops, q`\\<Esc>`);
      } catch {
        // Fail silently
      }
    };
    signal?.addEventListener("abort", closeInput, { once: true });
    using _eventListeners = {
      [Symbol.dispose]: () => signal?.removeEventListener("abort", closeInput),
    };

    using observer = new AsyncScheduler(async () => {
      const [cmdline, cmdpos] = await collect(denops, (denops) => [
        fn.getcmdline(denops),
        fn.getcmdpos(denops),
      ]);
      this.cmdline = cmdline;
      this.cmdpos = cmdpos;
    }, OBSERVER_INTERVAL);
    observer.start({ signal });

    const result = await input(denops, { prompt: HEADER });
    return result == null;
  }
}
