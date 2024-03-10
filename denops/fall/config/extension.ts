import { deepMerge } from "https://deno.land/std@0.218.2/collections/deep_merge.ts";
import { toFileUrl } from "https://deno.land/std@0.218.2/path/to_file_url.ts";
import {
  ensure,
  is,
  type PredicateType,
} from "https://deno.land/x/unknownutil@v3.16.3/mod.ts";
import defaultConfig from "./config.extension.json" with { type: "json" };

const isLoaderConfig = is.ObjectOf({
  uri: is.String,
  options: is.OptionalOf(is.RecordOf(is.Unknown, is.String)),
  variants: is.OptionalOf(
    is.RecordOf(is.RecordOf(is.Unknown, is.String), is.String),
  ),
});

const isExtensionConfig = is.ObjectOf({
  action: is.RecordOf(isLoaderConfig, is.String),
  previewer: is.RecordOf(isLoaderConfig, is.String),
  processor: is.RecordOf(isLoaderConfig, is.String),
  renderer: is.RecordOf(isLoaderConfig, is.String),
  source: is.RecordOf(isLoaderConfig, is.String),
});

type ExtensionConfig = PredicateType<typeof isExtensionConfig>;

export type ExtensionKind = keyof ExtensionConfig;

export function getExtensionConfig(): ExtensionConfig {
  return extensionConfig;
}

export async function loadExtensionConfig(path: string): Promise<void> {
  const customConfig = JSON.parse(await Deno.readTextFile(path));
  extensionConfig = ensure(
    deepMerge(defaultConfig, customConfig, {
      arrays: "replace",
    }),
    isExtensionConfig,
  );
}

let extensionConfig: ExtensionConfig = deepMerge(defaultConfig, {});
