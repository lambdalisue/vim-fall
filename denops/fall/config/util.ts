import type { Denops } from "https://deno.land/x/denops_std@v6.4.0/mod.ts";
import * as vars from "https://deno.land/x/denops_std@v6.4.0/variable/mod.ts";
import * as buffer from "https://deno.land/x/denops_std@v6.4.0/buffer/mod.ts";
import { ensure, is } from "jsr:@core/unknownutil@3.18.0";
import { parse as parseJsonc } from "jsr:@std/jsonc@0.224.0";
import { ensureDir } from "jsr:@std/fs@0.229.0/ensure-dir";
import { copy } from "jsr:@std/fs@0.229.0/copy";
import { exists } from "jsr:@std/fs@0.229.0/exists";
import { dirname } from "jsr:@std/path@0.225.0/dirname";

import {
  type ActionPickerConfig,
  type Config,
  isConfig,
  type SourcePickerConfig,
} from "./type.ts";
import { type ExtensionType } from "../extension/type.ts";

export function getSourcePickerConfig(
  name: string,
  config: Config,
): SourcePickerConfig {
  const [root] = name.split(":", 1);
  return {
    ...(config.picker?.source?.[""] ?? {}),
    ...(config.picker?.source?.[root] ?? {}),
    ...(config.picker?.source?.[name] ?? {}),
  };
}

export function getActionPickerConfig(
  name: string,
  config: Config,
): ActionPickerConfig {
  const [root] = name.split(":", 1);
  return {
    ...(config.picker?.action?.[""] ?? {}),
    ...(config.picker?.action?.[root] ?? {}),
    ...(config.picker?.action?.[name] ?? {}),
  };
}

export function getExtensionOptions<T extends ExtensionType>(
  type: T,
  name: string,
  config: Config,
): Record<string, unknown> {
  const [root] = name.split(":", 1);
  return {
    ...(config[type]?.[""] ?? {}),
    ...(config[type]?.[root] ?? {}),
    ...(config[type]?.[name] ?? {}),
  };
}

export async function getConfigPath(denops: Denops): Promise<string> {
  return ensure(
    await vars.g.get(denops, "fall_config_path"),
    is.String,
  );
}

export async function editConfig(
  denops: Denops,
  configPath: string,
): Promise<void> {
  await ensureConfig(configPath);
  await buffer.open(denops, configPath);
}

export async function loadConfig(configPath: string): Promise<Config> {
  try {
    await ensureConfig(configPath);
    const text = await Deno.readTextFile(configPath);
    const data = parseJsonc(text);
    return ensure(data, isConfig);
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      // Do not show warning messages when the file is not found
      return {};
    }
    console.warn(`[fall] Failed to load config file: ${err}`);
    return {};
  }
}

async function ensureConfig(configPath: string): Promise<void> {
  if (!await exists(configPath)) {
    await ensureDir(dirname(configPath));
    await copy(
      new URL("./config/config.default.jsonc", import.meta.url),
      configPath,
    );
  }
}
