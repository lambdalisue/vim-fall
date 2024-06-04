import type { Denops } from "https://deno.land/x/denops_std@v6.4.0/mod.ts";
import * as buffer from "https://deno.land/x/denops_std@v6.4.0/buffer/mod.ts";
import { parseArgs } from "jsr:@std/cli@0.224.5/parse-args";
import { ensure, is } from "jsr:@core/unknownutil@3.18.0";

import {
  getConfigDir,
  loadExtensionConfig,
  loadPickerConfig,
  loadStyleConfig,
} from "../config/mod.ts";

async function getConfigPath(type: string, configDir: string, options: {
  overwriteWithDefault: boolean;
}): Promise<string> {
  switch (type) {
    case "extension":
      return (await loadExtensionConfig(configDir, options)).path;
    case "picker":
      return (await loadPickerConfig(configDir, options)).path;
    case "style":
      return (await loadStyleConfig(configDir, options)).path;
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
      const { "overwrite-with-default": overwriteWithDefault, _: [type] } =
        parseArgs(
          ensure(args, is.ArrayOf(is.String)),
          {
            string: ["_"],
            boolean: ["overwrite-with-default"],
          },
        );
      const configDir = await getConfigDir(denops);
      const configPath = await getConfigPath(type, configDir, {
        overwriteWithDefault,
      });
      await editConfigFile(denops, configPath);
    },
  };
}
