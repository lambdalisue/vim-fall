import type { Denops } from "jsr:@denops/std@^7.3.2";
import * as fn from "jsr:@denops/std@^7.3.2/function";
import * as autocmd from "jsr:@denops/std@^7.3.2/autocmd";
import { input } from "jsr:@denops/std@^7.3.2/helper/input";
import { rawString, useEval } from "jsr:@denops/std@^7.3.2/eval";
import { collect } from "jsr:@denops/std@^7.3.2/batch";

import { dispatch } from "../event.ts";

export class Cmdliner {
  #cmdline: string;
  #cmdpos: number;

  constructor(params: { cmdline?: string; cmdpos?: number } = {}) {
    this.#cmdline = params.cmdline ?? "";
    this.#cmdpos = params.cmdpos ?? 0;
  }

  static async #feedkeys(denops: Denops, key: string): Promise<void> {
    try {
      if (!(await fn.mode(denops)).startsWith("c")) {
        return;
      }
      await useEval(denops, async (denops) => {
        await fn.feedkeys(denops, key, "n");
      });
    } catch (err) {
      // Fail silently
      const m = err instanceof Error ? err.message : String(err);
      console.debug(`[fall] Failed to feedkeys: ${m}`);
    }
  }

  static accept(denops: Denops): Promise<void> {
    return this.#feedkeys(denops, rawString`\<CR>`);
  }

  static cancel(denops: Denops): Promise<void> {
    return this.#feedkeys(denops, rawString`\<Esc>`);
  }

  async input(
    denops: Denops,
    { signal }: { signal?: AbortSignal },
  ): Promise<string | null> {
    using stack = new DisposableStack();
    const close = () => Cmdliner.cancel(denops);
    // Start input and wait for the result (or interruption)
    signal?.addEventListener("abort", close, { once: true });
    stack.defer(() => {
      signal?.removeEventListener("abort", close);
    });
    await autocmd.group(denops, "fall_util_cmdliner", (helper) => {
      helper.remove("*");
      helper.define(
        "CmdlineEnter",
        "*",
        `call setcmdline("${this.#cmdline}") | call setcmdpos("${this.#cmdpos}")`,
        { once: true },
      );
    });
    return input(denops);
  }

  async check(denops: Denops): Promise<void> {
    const [mode, cmdline, cmdpos] = await collect(denops, (denops) => [
      fn.mode(denops),
      fn.getcmdline(denops),
      fn.getcmdpos(denops),
    ]);
    if (!mode.startsWith("c")) {
      // Not in command-line mode
      return;
    }
    if (cmdline !== this.#cmdline) {
      dispatch({ type: "vim-cmdline-changed", cmdline });
    }
    if (cmdpos !== this.#cmdpos) {
      dispatch({ type: "vim-cmdpos-changed", cmdpos });
    }
    this.#cmdline = cmdline;
    this.#cmdpos = cmdpos;
  }
}
