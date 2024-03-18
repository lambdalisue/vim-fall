import type { Source } from "https://deno.land/x/fall_core@v0.6.0/mod.ts";
import {
  assert,
  ensure,
  is,
  PredicateType,
} from "https://deno.land/x/unknownutil@v3.16.3/mod.ts";

import {
  type ExtensionKind,
  isExtensionConfig,
  isExtensionKind,
} from "../../fall/config/extension.ts";

const isOptions = is.StrictOf(is.PartialOf(is.ObjectOf({
  kind: isExtensionKind,
})));

const isCatalog = is.ObjectOf({
  packages: is.ArrayOf(is.ObjectOf({
    name: is.String,
    url: is.String,
  })),
});

const isPackage = is.IntersectionOf([
  is.ObjectOf({
    name: is.String,
  }),
  isExtensionConfig,
]);

export const isExtensionDetail = is.ObjectOf({
  pkgName: is.String,
  name: is.String,
  kind: isExtensionKind,
  url: is.String,
  options: is.OptionalOf(is.RecordOf(is.Unknown, is.String)),
  variants: is.OptionalOf(
    is.RecordOf(is.RecordOf(is.Unknown, is.String), is.String),
  ),
});

const kinds = [
  "action",
  "filter",
  "previewer",
  "renderer",
  "sorter",
  "source",
] as const;

export function getSource(
  options: Record<string, unknown>,
): Source {
  assert(options, isOptions);
  const kind = options.kind;
  return {
    getStream: async (_denops, ..._args) => {
      const catalog = await fetchCatalog();
      return ReadableStream.from(catalog.packages)
        .pipeThrough(
          new TransformStream({
            transform: async ({ name, url }, controller) => {
              const pkg = await fetchPackage(name, url);
              if (!pkg) return;
              for (const k of kinds) {
                if (kind && k !== kind) {
                  continue;
                }
                for (const [name, lconf] of Object.entries(pkg[k] ?? {})) {
                  controller.enqueue({
                    value: `${pkg.name}/${k}/${name}`,
                    detail: toExtensionDetail(
                      pkg.name,
                      name,
                      k,
                      new URL(lconf.url, url),
                      lconf.options,
                      lconf.variants,
                    ),
                  });
                }
              }
            },
          }),
        );
    },
  };
}

async function fetchCatalog(): Promise<PredicateType<typeof isCatalog>> {
  const resp = await fetch(
    "https://vim-fall.github.io/catalog/v1/catalog.json",
  );
  if (!resp.ok) {
    throw new Error(
      `Failed to fetch catalog: ${resp.status} ${resp.statusText}`,
    );
  }
  return ensure(await resp.json(), isCatalog);
}

async function fetchPackage(
  name: string,
  url: string,
): Promise<PredicateType<typeof isPackage> | undefined> {
  const resp = await fetch(url);
  if (!resp.ok) {
    console.warn(
      `[fall] Failed to fetch package from ${url}: ${resp.status} ${resp.statusText}`,
    );
    return undefined;
  }
  const json = await resp.json();
  try {
    return ensure({
      name,
      base: new URL(url),
      action: {},
      filter: {},
      previewer: {},
      renderer: {},
      sorter: {},
      source: {},
      ...json,
    }, isPackage);
  } catch (err) {
    console.warn(`[fall] Invalid package from ${url}: ${err}`);
    return undefined;
  }
}

function toExtensionDetail(
  pkgName: string,
  name: string,
  kind: ExtensionKind,
  url: URL,
  options?: Record<string, unknown>,
  variants?: Record<string, Record<string, unknown>>,
): PredicateType<typeof isExtensionDetail> {
  return ensure({
    pkgName,
    name,
    kind,
    url: url.href,
    options,
    variants,
  }, isExtensionDetail);
}
