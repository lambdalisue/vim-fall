import type { Denops } from "jsr:@denops/std@^7.0.0";
import * as fn from "jsr:@denops/std@^7.0.0/function";
import { collect } from "jsr:@denops/std@^7.0.0/batch";
import { input, type InputOptions } from "jsr:@denops/std@^7.0.0/helper/input";
import { send } from "jsr:@denops/std@^7.0.0/helper/keymap";
import { exprQuote as q } from "jsr:@denops/std@^7.0.0/helper/expr_string";

import { startAsyncScheduler } from "../../util/async_scheduler.ts";
import { dispatch } from "../../util/event.ts";

const OBSERVER_INTERVAL = 10;

export function observeInput(
  denops: Denops,
  { signal }: { signal?: AbortSignal } = {},
): Disposable {
  let prevCmdline: string | undefined;
  let prevCmdpos: number | undefined;
  return startAsyncScheduler(
    async () => {
      const [mode, cmdline, cmdpos] = await collect(denops, (denops) => [
        fn.mode(denops),
        fn.getcmdline(denops),
        fn.getcmdpos(denops),
      ]);
      if (mode !== "c") {
        return;
      }
      if (cmdline !== prevCmdline) {
        dispatch("cmdline-changed", cmdline);
        prevCmdline = cmdline;
      }
      if (cmdpos !== prevCmdpos) {
        dispatch("cmdpos-changed", cmdpos);
        prevCmdpos = cmdpos;
      }
    },
    OBSERVER_INTERVAL,
    { signal },
  );
}

export async function startInput(
  denops: Denops,
  options: InputOptions,
  { signal }: { signal?: AbortSignal },
): Promise<boolean> {
  const closeInput = async () => {
    try {
      await send(denops, q`\<Esc>`);
    } catch (err) {
      // Fail silently
      const m = err.message ?? err;
      console.debug(`[fall] Failed to close input: ${m}`);
    }
  };
  signal?.addEventListener("abort", closeInput, { once: true });
  using _eventListeners = {
    [Symbol.dispose]: () => signal?.removeEventListener("abort", closeInput),
  };
  return await input(denops, options) == null;
}
