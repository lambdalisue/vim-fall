import { deepMerge } from "https://deno.land/std@0.218.2/collections/deep_merge.ts";
import { toFileUrl } from "https://deno.land/std@0.218.2/path/to_file_url.ts";
import {
  ensure,
  is,
  type PredicateType,
} from "https://deno.land/x/unknownutil@v3.16.3/mod.ts";
import builtinConfig from "./registry-config.builtin.json" with {
  type: "json",
};
import defaultConfig from "./registry-config.default.json" with {
  type: "json",
};

const isPackageExtension = is.ObjectOf({
  url: is.String,
  options: is.OptionalOf(is.RecordOf(is.Unknown, is.String)),
  variants: is.OptionalOf(
    is.RecordOf(is.RecordOf(is.Unknown, is.String), is.String),
  ),
});

const isPackage = is.PartialOf(is.ObjectOf({
  base: is.String,
  action: is.RecordOf(isPackageExtension, is.String),
  previewer: is.RecordOf(isPackageExtension, is.String),
  processor: is.RecordOf(isPackageExtension, is.String),
  renderer: is.RecordOf(isPackageExtension, is.String),
  source: is.RecordOf(isPackageExtension, is.String),
}));

type Package = PredicateType<typeof isPackage>;

const isRegistryConfig = is.ObjectOf({
  package: is.RecordOf(isPackage, is.String),
});

type RegistryConfig = PredicateType<typeof isRegistryConfig>;

export function getRegistryConfig(): RegistryConfig {
  return registryConfig;
}

export function getPackage(pkg: string): Package | undefined {
  return registryConfig.package[pkg];
}

export async function loadRegistryConfig(path: string): Promise<void> {
  const customConfig = JSON.parse(await Deno.readTextFile(path));
  registryConfig = ensure({
    ...deepMerge(builtinConfig, customConfig, {
      arrays: "replace",
    }),
    base: toFileUrl(path),
  }, isRegistryConfig);
}

let registryConfig: RegistryConfig = deepMerge(builtinConfig, defaultConfig);

export { defaultConfig };
