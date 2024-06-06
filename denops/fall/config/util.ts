import type { Denops } from "https://deno.land/x/denops_std@v6.4.0/mod.ts";
import * as vars from "https://deno.land/x/denops_std@v6.4.0/variable/mod.ts";
import { ensure, is, type Predicate } from "jsr:@core/unknownutil@3.18.0";
import { parse as parseYaml } from "jsr:@std/yaml@0.224.0/parse";
import { join } from "jsr:@std/path@0.225.1/join";
import { omit } from "jsr:@std/collections@0.224.2/omit";
import { deepMerge } from "jsr:@std/collections@0.224.2/deep-merge";
import { ensureDir } from "jsr:@std/fs@0.229.0/ensure-dir";

export function mergeConfigs<T extends Record<PropertyKey, unknown>>(
  ...configs: readonly T[]
): T {
  return configs.reduce((a, b) => deepMerge<T>(a, b, { arrays: "replace" }));
}

export async function getConfigDir(denops: Denops): Promise<string> {
  return ensure(
    await vars.g.get(denops, "fall_config_dir"),
    is.String,
  );
}

export async function loadConfig<T extends Record<string, unknown>>(
  name: string,
  pred: Predicate<T>,
  configDir: string,
  { overwriteWithDefault }: { overwriteWithDefault?: boolean } = {},
): Promise<T & { path: string }> {
  const path = join(configDir, `${name}.yaml`);
  if (overwriteWithDefault) {
    // Copy default file and retry
    await ensureDir(configDir);
    await Deno.copyFile(
      new URL(`./${name}/default.yaml`, import.meta.url),
      path,
    );
  }
  try {
    const text = await Deno.readTextFile(path);
    const data = ensure(parseYaml(text), is.Record);
    return {
      ...ensure(omit(data, ["$schema"]), pred),
      path,
    };
  } catch (err) {
    if (!overwriteWithDefault && err instanceof Deno.errors.NotFound) {
      return loadConfig(name, pred, configDir, { overwriteWithDefault: true });
    }
    const m = err.message ?? err;
    console.warn(`[fall] Failed to load ${name} config file: ${m}`);
    return {
      ...ensure({}, pred),
      path,
    };
  }
}
