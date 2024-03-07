import type {
  Action,
  Previewer,
  Processor,
  Renderer,
  Source,
} from "https://deno.land/x/fall_core@v0.3.0/mod.ts";

import { ExtensionConfig, getExtensionConfig } from "../config/extension.ts";
import { isDefined } from "../util/collection.ts";
import { expand } from "./util.ts";
import { resolve } from "./resolver.ts";

export async function loadExtension<K extends keyof ExtensionConfig>(
  type: K,
  name: string,
): Promise<Extension<K> | undefined> {
  const cache = cacheMap[type] as Map<string, Promise<Extension<K>>>;
  const loader = loaderMap[type] as (
    mod: unknown,
    options: Record<string, unknown>,
  ) => Promise<Extension<K>>;
  try {
    if (cache.has(name)) {
      return await cache.get(name)!;
    }
    const loaderConfig = getExtensionConfig()[type][name];
    if (!loaderConfig) {
      throw new Error(`No extension '${name}' found in ${type}.`);
    }
    const url = resolve(loaderConfig.uri);
    const mod = await import(url.toString());
    const promise = loader(
      mod,
      loaderConfig.options ?? {},
    );
    cache.set(name, promise);
    return await promise;
  } catch (err) {
    console.warn(`Failed to load '${name}' in ${type}:`, err);
    return undefined;
  }
}

export async function loadExtensions<K extends keyof ExtensionConfig>(
  type: K,
  exprs: string[],
): Promise<Map<string, Extension<K>>> {
  const names = Object.keys(getExtensionConfig()[type]);
  const entries = await Promise.all(
    exprs
      .flatMap((v) => expand(v, names))
      .map(async (v) => {
        const extension = await loadExtension(type, v);
        if (!extension) {
          return undefined;
        }
        return [v, extension] as const;
      }),
  );
  return new Map(entries.filter(isDefined));
}

function promish<T>(v: T | Promise<T>): Promise<T> {
  return v instanceof Promise ? v : Promise.resolve(v);
}

type Extension<K extends keyof ExtensionConfig> = K extends "action" ? Action
  : K extends "previewer" ? Previewer
  : K extends "processor" ? Processor
  : K extends "renderer" ? Renderer
  : K extends "source" ? Source
  : never;

const cacheMap = {
  action: new Map<string, Promise<Action>>(),
  previewer: new Map<string, Promise<Previewer>>(),
  processor: new Map<string, Promise<Processor>>(),
  renderer: new Map<string, Promise<Renderer>>(),
  source: new Map<string, Promise<Source>>(),
} as const satisfies {
  [K in keyof ExtensionConfig]: Map<string, Promise<Extension<K>>>;
};

const loaderMap = {
  action: (
    mod: unknown,
    options: Record<string, unknown>,
  ): Promise<Action> => {
    // deno-lint-ignore no-explicit-any
    return promish((mod as any).getAction(options));
  },
  previewer: (
    mod: unknown,
    options: Record<string, unknown>,
  ): Promise<Previewer> => {
    // deno-lint-ignore no-explicit-any
    return promish((mod as any).getPreviewer(options));
  },
  processor: (
    mod: unknown,
    options: Record<string, unknown>,
  ): Promise<Processor> => {
    // deno-lint-ignore no-explicit-any
    return promish((mod as any).getProcessor(options));
  },
  renderer: (
    mod: unknown,
    options: Record<string, unknown>,
  ): Promise<Renderer> => {
    // deno-lint-ignore no-explicit-any
    return promish((mod as any).getRenderer(options));
  },
  source: (
    mod: unknown,
    options: Record<string, unknown>,
  ): Promise<Source> => {
    // deno-lint-ignore no-explicit-any
    return promish((mod as any).getSource(options));
  },
} as const satisfies {
  [K in keyof ExtensionConfig]: (
    mod: unknown,
    options: Record<string, unknown>,
  ) => Promise<Extension<K>>;
};
