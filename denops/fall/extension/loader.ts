import { deepMerge } from "https://deno.land/std@0.219.0/collections/deep_merge.ts";
import type {
  Action,
  Filter,
  Previewer,
  Renderer,
  Sorter,
  Source,
} from "https://deno.land/x/fall_core@v0.6.0/mod.ts";

import {
  type ExtensionConfig,
  type ExtensionKind,
} from "../config/extension.ts";
import { isDefined } from "../util/collection.ts";
import { parseExpr, parsePattern, promish } from "./util.ts";

/**
 * Load an extension.
 *
 * This function never throws an error. Instead, it returns `undefined` if the
 * extension is not found or an error occurred.
 *
 * @param kind The kind of the extension.
 * @param expr The expression of the extension.
 * @param econf The extension configuration.
 * @returns The loaded extension if found.
 */
export async function loadExtension<K extends ExtensionKind>(
  kind: K,
  expr: string,
  econf: ExtensionConfig,
): Promise<Extension<K> | undefined> {
  if (expr === "") {
    return undefined;
  }
  const cache = cacheMap[kind] as Map<string, Promise<Extension<K>>>;
  const loader = loaderMap[kind] as (
    mod: unknown,
    options: Record<string, unknown>,
  ) => Promise<Extension<K>>;
  try {
    if (cache.has(expr)) {
      return await cache.get(expr)!;
    }
    const [url, options] = getLoaderInfo(kind, expr, econf);
    const mod = await import(url);
    const promise = (async () => {
      return await loader(mod, options);
    })();
    cache.set(expr, promise);
    return await promise;
  } catch (err) {
    console.warn(`[fall] Failed to load ${kind} extension '${expr}': ${err}`);
    return undefined;
  }
}

/**
 * Load extensions.
 *
 * This function never throws an error. Instead, it returns an empty map if an
 * error occurred.
 *
 * @param kind The kind of the extensions.
 * @param patterns The patterns of the extensions.
 * @param econf The extension configuration.
 * @returns The loaded extensions.
 */
export async function loadExtensions<K extends ExtensionKind>(
  kind: K,
  patterns: string[],
  econf: ExtensionConfig,
): Promise<Map<string, Extension<K>>> {
  const conf: ExtensionConfig[K] = econf[kind] ?? {};
  const exprs = Object.entries(conf).flatMap(
    ([name, config]) => {
      if (!config.variants) {
        return [name];
      }
      return [name, ...Object.keys(config.variants).map((v) => `${name}:${v}`)];
    },
  );
  const entries = await Promise.all(
    patterns
      .flatMap((v) => parsePattern(v, exprs))
      .map(async (v) => {
        const extension = await loadExtension(kind, v, econf);
        if (!extension) {
          return undefined;
        }
        return [v, extension] as const;
      }),
  );
  return new Map(entries.filter(isDefined));
}

function getLoaderInfo<K extends ExtensionKind>(
  kind: K,
  expr: string,
  econf: ExtensionConfig,
): [string, Record<string, unknown>] {
  const conf: ExtensionConfig[K] = econf[kind] ?? {};
  const [name, variant] = parseExpr(expr);
  const lconf = conf[name];
  if (!lconf) {
    throw new Error(`No ${kind} extension '${name}' found.`);
  }
  const options = deepMerge(
    lconf.options ?? {},
    variant ? (lconf.variants ?? {})[variant] : {},
    { arrays: "replace" },
  );
  return [lconf.url, options];
}

type Extension<K extends ExtensionKind> = K extends "action" ? Action
  : K extends "filter" ? Filter
  : K extends "previewer" ? Previewer
  : K extends "renderer" ? Renderer
  : K extends "sorter" ? Sorter
  : K extends "source" ? Source
  : never;

const cacheMap = {
  action: new Map<string, Promise<Action>>(),
  filter: new Map<string, Promise<Filter>>(),
  previewer: new Map<string, Promise<Previewer>>(),
  renderer: new Map<string, Promise<Renderer>>(),
  sorter: new Map<string, Promise<Sorter>>(),
  source: new Map<string, Promise<Source>>(),
} as const satisfies {
  [K in ExtensionKind]: Map<string, Promise<Extension<K>>>;
};

const loaderMap = {
  action: (
    mod: unknown,
    options: Record<string, unknown>,
  ): Promise<Action> => {
    // deno-lint-ignore no-explicit-any
    return promish((mod as any).getAction(options));
  },
  filter: (
    mod: unknown,
    options: Record<string, unknown>,
  ): Promise<Filter> => {
    // deno-lint-ignore no-explicit-any
    return promish((mod as any).getFilter(options));
  },
  previewer: (
    mod: unknown,
    options: Record<string, unknown>,
  ): Promise<Previewer> => {
    // deno-lint-ignore no-explicit-any
    return promish((mod as any).getPreviewer(options));
  },
  renderer: (
    mod: unknown,
    options: Record<string, unknown>,
  ): Promise<Renderer> => {
    // deno-lint-ignore no-explicit-any
    return promish((mod as any).getRenderer(options));
  },
  sorter: (
    mod: unknown,
    options: Record<string, unknown>,
  ): Promise<Sorter> => {
    // deno-lint-ignore no-explicit-any
    return promish((mod as any).getSorter(options));
  },
  source: (
    mod: unknown,
    options: Record<string, unknown>,
  ): Promise<Source> => {
    // deno-lint-ignore no-explicit-any
    return promish((mod as any).getSource(options));
  },
} as const satisfies {
  [K in ExtensionKind]: (
    mod: unknown,
    options: Record<string, unknown>,
  ) => Promise<Extension<K>>;
};

export const _internal = {
  getLoaderInfo,
};
