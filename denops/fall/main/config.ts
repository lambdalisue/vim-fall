import type { Denops } from "https://deno.land/x/denops_std@v6.4.0/mod.ts";

import { editConfig, getConfigPath } from "../config/util.ts";

export function main(denops: Denops): void {
  denops.dispatcher = {
    ...denops.dispatcher,
    "config:edit": async () => {
      const configPath = await getConfigPath(denops);
      await editConfig(denops, configPath);
    },
  };
}
