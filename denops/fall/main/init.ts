import type { Denops } from "https://deno.land/x/denops_std@v6.4.0/mod.ts";

import { reloadExtensionConfig, reloadPickerConfig } from "./config.ts";

export function init(denops: Denops): Promise<void> {
  if (initWaiter) {
    return initWaiter;
  }
  initWaiter = (async () => {
    await reloadExtensionConfig(denops);
    await reloadPickerConfig(denops);
  })();
  return initWaiter;
}

let initWaiter: Promise<void> | undefined;
