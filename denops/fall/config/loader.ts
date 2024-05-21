import type { Denops } from "https://deno.land/x/denops_std@v6.4.0/mod.ts";
import * as vars from "https://deno.land/x/denops_std@v6.4.0/variable/mod.ts";
import { ensure, is, type Predicate } from "jsr:@core/unknownutil@3.18.0";
import { parse as parseYaml } from "jsr:@std/yaml@0.224.0/parse";
import { join } from "jsr:@std/path@0.225.1/join";
import { omit } from "jsr:@std/collections@0.224.2/omit";
import { ensureDir } from "jsr:@std/fs@0.229.0/ensure-dir";

import { type ExtensionConfig, isExtensionConfig } from "./extension.ts";
import { isPickerConfig, type PickerConfig } from "./picker.ts";
import { isStyleConfig, type StyleConfig } from "./style.ts";

export async function getConfigDir(denops: Denops): Promise<string> {
  return ensure(
    await vars.g.get(denops, "fall_config_dir"),
    is.String,
  );
}

export function loadExtensionConfig(
  configDir: string,
): Promise<ExtensionConfig & { path: string }> {
  return loadConfig(
    "extension",
    isExtensionConfig,
    configDir,
  );
}

export function loadPickerConfig(
  configDir: string,
): Promise<PickerConfig & { path: string }> {
  return loadConfig(
    "picker",
    isPickerConfig,
    configDir,
  );
}

export function loadStyleConfig(
  configDir: string,
): Promise<StyleConfig & { path: string }> {
  return loadConfig(
    "style",
    isStyleConfig,
    configDir,
  );
}

async function loadConfig<T extends Record<string, unknown>>(
  name: string,
  pred: Predicate<T>,
  configDir: string,
  { skipRetry }: { skipRetry?: boolean } = {},
): Promise<T & { path: string }> {
  const path = join(configDir, `${name}.yaml`);
  try {
    const text = await Deno.readTextFile(path);
    const data = ensure(parseYaml(text), is.Record);
    return {
      ...ensure(omit(data, ["$schema"]), pred),
      path,
    };
  } catch (err) {
    if (!skipRetry && err instanceof Deno.errors.NotFound) {
      // Copy default file and retry
      await ensureDir(configDir);
      await Deno.copyFile(
        new URL(`./${name}.default.yaml`, import.meta.url),
        path,
      );
      return loadConfig(name, pred, path, { skipRetry: true });
    }
    const m = err.message ?? err;
    console.warn(`[fall] Failed to load ${name} setting file: ${m}`);
    return {
      ...ensure({}, pred),
      path,
    };
  }
}
