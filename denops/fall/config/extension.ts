import { deepMerge } from "https://deno.land/std@0.218.2/collections/deep_merge.ts";
import {
  ensure,
  is,
  type PredicateType,
} from "https://deno.land/x/unknownutil@v3.16.3/mod.ts";
import builtin from "./config.extension.json" with { type: "json" };

export type ExtensionConfig = PredicateType<typeof isExtensionConfig>;

export const isLoaderConfig = is.ObjectOf({
  uri: is.String,
  options: is.OptionalOf(is.RecordOf(is.Unknown, is.String)),
  variants: is.OptionalOf(
    is.RecordOf(is.RecordOf(is.Unknown, is.String), is.String),
  ),
});

export const isExtensionConfig = is.ObjectOf({
  action: is.RecordOf(isLoaderConfig, is.String),
  previewer: is.RecordOf(isLoaderConfig, is.String),
  processor: is.RecordOf(isLoaderConfig, is.String),
  renderer: is.RecordOf(isLoaderConfig, is.String),
  source: is.RecordOf(isLoaderConfig, is.String),
});

export function getExtensionConfig(): ExtensionConfig {
  return extensionConfig;
}

export function resetExtensionConfig(): void {
  Object.assign(extensionConfig, builtin);
}

export async function loadExtensionConfig(url: URL): Promise<void> {
  const response = await fetch(url);
  const data = ensure(response.json(), isExtensionConfig);
  Object.assign(
    extensionConfig,
    deepMerge(extensionConfig, data, { arrays: "replace" }),
  );
}

const extensionConfig = deepMerge({}, builtin, {
  arrays: "replace",
}) satisfies ExtensionConfig;
