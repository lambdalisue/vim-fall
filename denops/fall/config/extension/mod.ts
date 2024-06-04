import { is, type Predicate } from "jsr:@core/unknownutil@3.18.0";

import { loadConfig, mergeConfigs } from "../util.ts";

export type ExtensionOptions = {
  readonly description?: string;
  readonly options: Readonly<Record<string, unknown>>;
};

export type ExtensionConfig = {
  readonly source?: Readonly<Record<string, ExtensionOptions>>;
  readonly projector?: Readonly<Record<string, ExtensionOptions>>;
  readonly renderer?: Readonly<Record<string, ExtensionOptions>>;
  readonly previewer?: Readonly<Record<string, ExtensionOptions>>;
  readonly action?: Readonly<Record<string, ExtensionOptions>>;
};

const isExtensionOptions = is.ObjectOf({
  description: is.OptionalOf(is.String),
  options: is.RecordOf(
    is.Unknown,
    is.String,
  ),
}) satisfies Predicate<ExtensionOptions>;

const isExtensionConfig = is.PartialOf(is.ObjectOf({
  source: is.RecordOf(isExtensionOptions, is.String),
  projector: is.RecordOf(isExtensionOptions, is.String),
  renderer: is.RecordOf(isExtensionOptions, is.String),
  previewer: is.RecordOf(isExtensionOptions, is.String),
  action: is.RecordOf(isExtensionOptions, is.String),
})) satisfies Predicate<ExtensionConfig>;

type ExtensionType = keyof ExtensionConfig;

export function getExtensionOptions(
  conf: ExtensionConfig,
  type: ExtensionType,
  name: string,
): ExtensionOptions {
  const [root] = name.split(":", 1);
  return mergeConfigs(
    conf[type]?.[root] ?? { options: {} },
    conf[type]?.[name] ?? { options: {} },
  );
}

export function loadExtensionConfig(
  configDir: string,
  { overwriteWithDefault }: { overwriteWithDefault?: boolean } = {},
): Promise<ExtensionConfig & { path: string }> {
  return loadConfig(
    "extension",
    isExtensionConfig,
    configDir,
    { overwriteWithDefault },
  );
}
