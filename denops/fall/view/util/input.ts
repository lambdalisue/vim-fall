import type { Denops } from "https://deno.land/x/denops_std@v6.4.0/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v6.4.0/function/mod.ts";
import { collect } from "https://deno.land/x/denops_std@v6.4.0/batch/mod.ts";
import {
  input,
  type InputOptions,
} from "https://deno.land/x/denops_std@v6.4.0/helper/input.ts";
import { send } from "https://deno.land/x/denops_std@v6.4.0/helper/keymap.ts";
import { exprQuote as q } from "https://deno.land/x/denops_std@v6.4.0/helper/expr_string.ts";

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
      }
      if (cmdpos !== prevCmdpos) {
        dispatch("cmdpos-changed", cmdpos);
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
      console.debug("[fall] Failed to close input", err);
    }
  };
  signal?.addEventListener("abort", closeInput, { once: true });
  using _eventListeners = {
    [Symbol.dispose]: () => signal?.removeEventListener("abort", closeInput),
  };
  return await input(denops, options) == null;
}
