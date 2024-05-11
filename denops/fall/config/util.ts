import type { Denops } from "https://deno.land/x/denops_std@v6.4.0/mod.ts";
import { batch } from "https://deno.land/x/denops_std@v6.4.0/batch/mod.ts";
import * as vars from "https://deno.land/x/denops_std@v6.4.0/variable/mod.ts";
import * as buffer from "https://deno.land/x/denops_std@v6.4.0/buffer/mod.ts";
import * as opt from "https://deno.land/x/denops_std@v6.4.0/option/mod.ts";
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
  expr: string,
  config: Config,
): SourcePickerConfig {
  const [name] = expr.split(":", 1);
  return {
    ...(config.picker?.source?.[""] ?? {}),
    ...(config.picker?.source?.[name] ?? {}),
    ...(config.picker?.source?.[expr] ?? {}),
  };
}

export function getActionPickerConfig(
  expr: string,
  config: Config,
): ActionPickerConfig {
  const [name] = expr.split(":", 1);
  return {
    ...(config.picker?.action?.[""] ?? {}),
    ...(config.picker?.action?.[name] ?? {}),
    ...(config.picker?.action?.[expr] ?? {}),
  };
}

export function getExtensionOptions<T extends ExtensionType>(
  type: T,
  expr: string,
  config: Config,
): Record<string, unknown> {
  const [name] = expr.split(":", 1);
  return {
    ...(config[type]?.[""] ?? {}),
    ...(config[type]?.[name] ?? {}),
    ...(config[type]?.[expr] ?? {}),
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
  await batch(denops, async (denops) => {
    await opt.autochdir.set(denops, false);
    await opt.bufhidden.set(denops, "wipe");
  });
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
