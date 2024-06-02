import type { Denops } from "https://deno.land/x/denops_std@v6.4.0/mod.ts";

import { type ExtensionConfig, getExtensionOptions } from "../config/mod.ts";
import type { ExtensionLoader, ExtensionType, GetExtension } from "./type.ts";
import { registry } from "./registry.ts";

export async function loadExtension<
  T extends ExtensionType,
  R = GetExtension<T>,
>(
  denops: Denops,
  conf: ExtensionConfig,
  type: T,
  name: string,
): Promise<R | undefined> {
  try {
    const [root] = name.split(":", 1);
    const loader = registry[type].get(root);
    if (!loader) {
      throw new Error(`No ${type} extension '${root}' is registered`);
    }
    const opt = await loader.load(
      denops,
      getExtensionOptions(conf, type, name),
    );
    if (!opt) {
      console.warn(`[fall] No ${type} extension '${root}' exist. Skip`);
      return;
    }
    return {
      ...opt,
      script: loader.script,
      name,
    } as R;
  } catch (err) {
    const m = err.message ?? err;
    console.error(`[fall] Failed to load ${type} extension '${name}': ${m}`);
  }
}

export async function loadExtensions<
  T extends ExtensionType,
  R = GetExtension<T>,
>(
  denops: Denops,
  conf: ExtensionConfig,
  type: T,
  names: readonly string[],
): Promise<readonly R[]> {
  const extensions: R[] = [];
  for (const name of names) {
    if (name.includes("*")) {
      const keys = [
        ...registry[type].keys(),
        ...Object.keys(conf[type] ?? {}),
      ];
      const [head, tail] = name.split("*", 2);
      const exts = await loadExtensions(
        denops,
        conf,
        type,
        keys.filter((v) =>
          (!head || v.startsWith(head)) && (!tail || v.endsWith(tail))
        ),
      );
      extensions.push(...(exts as R[]));
    } else {
      const ext = await loadExtension(denops, conf, type, name);
      if (ext) {
        extensions.push(ext as R);
      }
    }
  }
  return extensions;
}

export function listExtensionLoaders<
  T extends ExtensionType,
  R = GetExtension<T>,
>(
  type: T,
): readonly ExtensionLoader<R>[] {
  return [...registry[type].values()] as ExtensionLoader<R>[];
}
