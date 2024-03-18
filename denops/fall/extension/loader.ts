import type {
  Action,
  Filter,
  Previewer,
  Renderer,
  Sorter,
  Source,
} from "https://deno.land/x/fall_core@v0.5.1/mod.ts";

import {
  type ExtensionConfig,
  type ExtensionKind,
} from "../config/extension.ts";
import { isDefined } from "../util/collection.ts";
import { resolve } from "./resolver.ts";

export async function loadExtension<K extends ExtensionKind>(
  kind: K,
  expr: string,
  econf: ExtensionConfig,
): Promise<WithUrl<Extension<K>> | undefined> {
  const cache = cacheMap[kind] as unknown as Map<
    string,
    Promise<WithUrl<Extension<K>>>
  >;
  const loader = loaderMap[kind] as (
    mod: unknown,
    options: Record<string, unknown>,
  ) => Promise<Extension<K>>;
  try {
    if (cache.has(expr)) {
      return await cache.get(expr)!;
    }
    const [url, options] = await getLoaderInfo(kind, expr, econf);
    const mod = await import(url.toString());
    const promise = (async () => {
      return { url: url.href, ...(await loader(mod, options)) };
    })();
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
  econf: ExtensionConfig,
): Promise<Map<string, WithUrl<Extension<K>>>> {
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

function promish<T>(v: T | Promise<T>): Promise<T> {
  return v instanceof Promise ? v : Promise.resolve(v);
}

async function getLoaderInfo<K extends ExtensionKind>(
  kind: K,
  expr: string,
  econf: ExtensionConfig,
): Promise<[URL, Record<string, unknown>]> {
  const conf: ExtensionConfig[K] = econf[kind] ?? {};
  const [name, variant] = parseExpr(expr);
  const lconf = conf[name];
  if (!lconf) {
    throw new Error(`No ${kind} extension '${name}' found.`);
  }
  const url = await resolve(lconf.url);
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
  : K extends "filter" ? Filter
  : K extends "previewer" ? Previewer
  : K extends "renderer" ? Renderer
  : K extends "sorter" ? Sorter
  : K extends "source" ? Source
  : never;

type WithUrl<T> = T & { url: string };

const cacheMap = {
  action: new Map<string, Promise<WithUrl<Action>>>(),
  filter: new Map<string, Promise<WithUrl<Filter>>>(),
  previewer: new Map<string, Promise<WithUrl<Previewer>>>(),
  renderer: new Map<string, Promise<WithUrl<Renderer>>>(),
  sorter: new Map<string, Promise<WithUrl<Sorter>>>(),
  source: new Map<string, Promise<WithUrl<Source>>>(),
} as const satisfies {
  [K in ExtensionKind]: Map<string, Promise<WithUrl<Extension<K>>>>;
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
  parseExpr,
  parsePattern,
};
