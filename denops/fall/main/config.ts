import type { Denops } from "jsr:@denops/std@^7.0.0";
import * as buffer from "jsr:@denops/std@^7.0.0/buffer";
import { parseArgs } from "jsr:@std/cli@^1.0.0/parse-args";
import {
  assert,
  ensure,
  is,
  type Predicate,
} from "jsr:@core/unknownutil@^3.18.0";

import {
  getConfigDir,
  loadExtensionConfig,
  loadPickerConfig,
  loadStyleConfig,
} from "../config/mod.ts";

type ConfigType = "extension" | "picker" | "style";

type GetConfig<T extends ConfigType> = T extends "extension"
  ? ReturnType<typeof loadExtensionConfig>
  : T extends "picker" ? ReturnType<typeof loadPickerConfig>
  : T extends "style" ? ReturnType<typeof loadStyleConfig>
  : never;

const isConfigType = is.LiteralOneOf(
  ["extension", "picker", "style"] as const,
) satisfies Predicate<ConfigType>;

function loadConfig<T extends ConfigType, R = GetConfig<T>>(
  type: T,
  configDir: string,
  options?: { overwriteWithDefault?: boolean },
): R {
  switch (type) {
    case "extension":
      return loadExtensionConfig(configDir, options) as R;
    case "picker":
      return loadPickerConfig(configDir, options) as R;
    case "style":
      return loadStyleConfig(configDir, options) as R;
    default:
      throw new Error(`Unknown config type: ${type}`);
  }
}

async function getConfigPath(
  type: "extension" | "picker" | "style",
  configDir: string,
  options: {
    overwriteWithDefault: boolean;
  },
): Promise<string> {
  return (await loadConfig(type, configDir, options)).path;
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
    "config:load": async (type) => {
      assert(type, isConfigType);
      const configDir = await getConfigDir(denops);
      const config = await loadConfig(type, configDir);
      return config;
    },
    "config:edit": async (args) => {
      const { "overwrite-with-default": overwriteWithDefault, _: [type] } =
        parseArgs(
          ensure(args, is.ArrayOf(is.String)),
          {
            string: ["_"],
            boolean: ["overwrite-with-default"],
          },
        );
      assert(type, isConfigType);
      const configDir = await getConfigDir(denops);
      const configPath = await getConfigPath(type, configDir, {
        overwriteWithDefault,
      });
      await editConfigFile(denops, configPath);
    },
  };
}
