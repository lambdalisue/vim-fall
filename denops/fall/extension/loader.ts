import type {
  Action,
  Previewer,
  Processor,
  Renderer,
  Source,
} from "https://deno.land/x/fall_core@v0.3.0/mod.ts";

import { ExtensionKind, getExtensionConfig } from "../config/extension.ts";
import { isDefined } from "../util/collection.ts";
import { resolve } from "./resolver.ts";

export async function loadExtension<K extends ExtensionKind>(
  kind: K,
  expr: string,
): Promise<Extension<K> | undefined> {
  const cache = cacheMap[kind] as Map<string, Promise<Extension<K>>>;
  const loader = loaderMap[kind] as (
    mod: unknown,
    options: Record<string, unknown>,
  ) => Promise<Extension<K>>;
  try {
    if (cache.has(expr)) {
      return await cache.get(expr)!;
    }
    const [url, options] = await getLoaderInfo(kind, expr);
    const mod = await import(url.toString());
    const promise = loader(mod, options);
    cache.set(expr, promise);
    return await promise;
  } catch (err) {
    console.warn(`Failed to load ${kind} '${expr}':`, err);
    return undefined;
  }
}

export async function loadExtensions<K extends ExtensionKind>(
  kind: K,
  patterns: string[],
): Promise<Map<string, Extension<K>>> {
  const exprs = Object.entries(getExtensionConfig()[kind]).flatMap(
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
        const extension = await loadExtension(kind, v);
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

async function getLoaderInfo<K extends ExtensionKind>(
  kind: K,
  expr: string,
): Promise<[URL, Record<string, unknown>]> {
  const [name, variant] = parseExpr(expr);
  const econf = getExtensionConfig();
  const lconf = econf[kind][name];
  if (!lconf) {
    throw new Error(`No ${kind} extension '${name}' found.`);
  }
  const url = await resolve(lconf.url, econf.base);
  return [
    url,
    (variant ? (lconf.variants ?? {})[variant] : lconf.options) ?? {},
  ];
}

function parseExpr(expr: string): [string, string | undefined] {
  const [name, ...rest] = expr.split(":");
  if (rest.length === 0) {
    return [name, undefined];
  }
  return [name, rest.join(":")];
}

function parsePattern(pattern: string, exprs: string[]): string[] {
  if (!pattern.includes("*")) {
    return [pattern];
  }
  const [head, tail, ...rest] = pattern.split("*");
  if (rest.length > 0) {
    throw new Error("Only one '*' is allowed in the expression.");
  }
  return exprs.filter((expr) => expr.startsWith(head) && expr.endsWith(tail));
}

type Extension<K extends ExtensionKind> = K extends "action" ? Action
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
  [K in ExtensionKind]: (
    mod: unknown,
    options: Record<string, unknown>,
  ) => Promise<Extension<K>>;
};

export const _internal = {
  getLoaderInfo,
  parseExpr,
  parsePattern,
};
