import type { Denops } from "https://deno.land/x/denops_std@v6.4.0/mod.ts";
import * as vars from "https://deno.land/x/denops_std@v6.4.0/variable/mod.ts";
import * as buffer from "https://deno.land/x/denops_std@v6.4.0/buffer/mod.ts";
import { ensure, is, type Predicate } from "jsr:@core/unknownutil@3.18.0";
import { parse as parseYaml } from "jsr:@std/yaml@0.224.0/parse";
import { deepMerge } from "jsr:@std/collections@0.224.2/deep-merge";
import { ensureDir } from "jsr:@std/fs@0.229.0/ensure-dir";
import { dirname } from "jsr:@std/path@0.225.0/dirname";

export function mergeConfigs<T extends Record<PropertyKey, unknown>>(
  ...configs: T[]
): T {
  return configs.reduce((a, b) => deepMerge<T>(a, b, { arrays: "replace" }));
}

export async function loadConfig<T extends Record<string, unknown>>(
  name: string,
  pred: Predicate<T>,
  path: string,
  { skipRetry }: { skipRetry?: boolean } = {},
): Promise<T> {
  try {
    const text = await Deno.readTextFile(path);
    const data = parseYaml(text);
    return ensure(data, pred);
  } catch (err) {
    if (!skipRetry && err instanceof Deno.errors.NotFound) {
      // Copy default file and retry
      await ensureDir(dirname(path));
      await Deno.copyFile(
        new URL(`./${name}.default.yaml`, import.meta.url),
        path,
      );
      return loadConfig(name, pred, path, { skipRetry: true });
    }
    const m = err.message ?? err;
    console.warn(`[fall] Failed to load ${name} setting file: ${m}`);
    return ensure({}, pred);
  }
}

export async function getConfigDir(denops: Denops): Promise<string> {
  return ensure(
    await vars.g.get(denops, "fall_config_dir"),
    is.String,
  );
}

export async function editConfig(
  denops: Denops,
  configPath: string,
): Promise<void> {
  await buffer.open(denops, configPath);
}
