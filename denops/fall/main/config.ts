import type { Denops } from "https://deno.land/x/denops_std@v6.4.0/mod.ts";
import * as buffer from "https://deno.land/x/denops_std@v6.4.0/buffer/mod.ts";

import {
  getConfigDir,
  loadExtensionConfig,
  loadPickerConfig,
  loadStyleConfig,
} from "../config/loader.ts";

async function editConfigFile(
  denops: Denops,
  configPath: string,
): Promise<void> {
  await buffer.open(denops, configPath);
}

export function main(denops: Denops): void {
  denops.dispatcher = {
    ...denops.dispatcher,
    "config:edit:extension": async () => {
      const configDir = await getConfigDir(denops);
      const conf = await loadExtensionConfig(configDir);
      await editConfigFile(denops, conf.path);
    },
    "config:edit:picker": async () => {
      const configDir = await getConfigDir(denops);
      const conf = await loadPickerConfig(configDir);
      await editConfigFile(denops, conf.path);
    },
    "config:edit:style": async () => {
      const configDir = await getConfigDir(denops);
      const conf = await loadStyleConfig(configDir);
      await editConfigFile(denops, conf.path);
    },
  };
}
