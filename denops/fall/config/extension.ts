import { deepMerge } from "https://deno.land/std@0.218.2/collections/deep_merge.ts";
import {
  ensure,
  is,
  type PredicateType,
} from "https://deno.land/x/unknownutil@v3.16.3/mod.ts";
import builtinConfig from "./extension-config.builtin.json" with {
  type: "json",
};
import defaultConfig from "./extension-config.default.json" with {
  type: "json",
};

import { getExtensionConfigPath } from "../const.ts";

export const isExtensionKind = is.LiteralOneOf(
  [
    "action",
    "filter",
    "previewer",
    "renderer",
    "sorter",
    "source",
  ] as const,
);

export type ExtensionKind = PredicateType<typeof isExtensionKind>;

const isLoaderConfig = is.ObjectOf({
  url: is.String,
  options: is.OptionalOf(is.RecordOf(is.Unknown, is.String)),
  variants: is.OptionalOf(
    is.RecordOf(is.RecordOf(is.Unknown, is.String), is.String),
  ),
});

export const isExtensionConfig = is.ObjectOf({
  action: is.RecordOf(isLoaderConfig, is.String),
  filter: is.RecordOf(isLoaderConfig, is.String),
  previewer: is.RecordOf(isLoaderConfig, is.String),
  renderer: is.RecordOf(isLoaderConfig, is.String),
  sorter: is.RecordOf(isLoaderConfig, is.String),
  source: is.RecordOf(isLoaderConfig, is.String),
});

export type ExtensionConfig = PredicateType<typeof isExtensionConfig>;

const isPartialExtensionConfig = is.PartialOf(isExtensionConfig);

export type PartialExtensionConfig = PredicateType<
  typeof isPartialExtensionConfig
>;

export function getExtensionConfig(): ExtensionConfig {
  return ensure(
    deepMerge(builtinConfig, customConfig, {
      arrays: "replace",
    }),
    isExtensionConfig,
  );
}

export async function loadExtensionConfig(): Promise<void> {
  try {
    customConfig = ensure(
      JSON.parse(await Deno.readTextFile(getExtensionConfigPath())),
      isPartialExtensionConfig,
    );
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      customConfig = defaultConfig;
      return;
    }
    throw err;
  }
}

export async function saveExtensionConfig(
  patch: PartialExtensionConfig,
): Promise<void> {
  const config = deepMerge(
    customConfig,
    patch,
    {
      arrays: "replace",
    },
  );
  await Deno.writeTextFile(
    getExtensionConfigPath(),
    JSON.stringify(config, null, 2),
  );
}

let customConfig: PartialExtensionConfig = defaultConfig;

export { defaultConfig };
