import type { Denops } from "https://deno.land/x/denops_std@v6.4.0/mod.ts";
import * as buffer from "https://deno.land/x/denops_std@v6.4.0/buffer/mod.ts";
import { assert, is } from "jsr:@core/unknownutil@3.18.0";

import {
  getConfigDir,
  loadExtensionConfig,
  loadPickerConfig,
  loadStyleConfig,
} from "../config/mod.ts";

async function getConfigPath(type: string, configDir: string): Promise<string> {
  switch (type) {
    case "extension":
      return (await loadExtensionConfig(configDir)).path;
    case "picker":
      return (await loadPickerConfig(configDir)).path;
    case "style":
      return (await loadStyleConfig(configDir)).path;
    default:
      throw new Error(`Unknown config type: ${type}`);
  }
}

async function editConfigFile(
  denops: Denops,
  configPath: string,
): Promise<void> {
  await buffer.open(denops, configPath);
}

export function main(denops: Denops): void {
  denops.dispatcher = {
    ...denops.dispatcher,
    "config:edit": async (args) => {
      assert(args, is.ArrayOf(is.String));
      const type = args[0];
      const configDir = await getConfigDir(denops);
      const configPath = await getConfigPath(type, configDir);
      await editConfigFile(denops, configPath);
    },
  };
}
