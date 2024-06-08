import type { Denops } from "https://deno.land/x/denops_std@v6.4.0/mod.ts";

import { type ExtensionConfig, getExtensionOptions } from "../config/mod.ts";
import type {
  Extension,
  ExtensionLoader,
  ExtensionType,
  GetExtension,
} from "./type.ts";
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
    const extopt = getExtensionOptions(conf, type, name);
    const opt = await loader.load(denops, extopt.options);
    if (!opt) {
      console.warn(`[fall] No ${type} extension '${root}' exist. Skip`);
      return;
    }
    return {
      ...opt,
      description: extopt.description ?? opt.description,
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

export function listExtensionLoaders(): readonly ExtensionLoader<Extension>[];
export function listExtensionLoaders<T extends ExtensionType>(
  type: T,
): readonly ExtensionLoader<GetExtension<T>>[];
export function listExtensionLoaders<T extends ExtensionType>(
  type?: T,
): readonly ExtensionLoader<Extension>[] {
  if (type) {
    return [...registry[type].values()];
  } else {
    return [
      ...registry.source.values(),
      ...registry.projector.values(),
      ...registry.renderer.values(),
      ...registry.previewer.values(),
      ...registry.action.values(),
    ];
  }
}
