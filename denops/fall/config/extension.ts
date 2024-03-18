import { toFileUrl } from "https://deno.land/std@0.217.0/path/to_file_url.ts";
import { match, placeholder as _ } from "jsr:@core/match@0.2.5";
import {
  is,
  maybe,
  type Predicate,
  type PredicateType,
} from "https://deno.land/x/unknownutil@v3.16.3/mod.ts";

const builtinPattern = _`fallbuiltin://${_("path")}`;

type LoaderConfig = PredicateType<typeof isLoaderConfig>;
export type ExtensionKind = PredicateType<typeof isExtensionKind>;
export type ExtensionConfig = PredicateType<typeof isExtensionConfig>;

export const extensionKinds = [
  "action",
  "filter",
  "previewer",
  "renderer",
  "sorter",
  "source",
] as const;

const isUnknownStringRecord = is.RecordOf(is.Unknown, is.String);

const isLoaderConfig = is.ObjectOf({
  url: is.String,
  options: is.OptionalOf(isUnknownStringRecord),
  variants: is.OptionalOf(is.RecordOf(isUnknownStringRecord, is.String)),
});

export const isExtensionKind = is.LiteralOneOf(extensionKinds);

export const isExtensionConfig = is.PartialOf(is.ObjectOf(
  {
    action: is.RecordOf(isLoaderConfig, is.String),
    filter: is.RecordOf(isLoaderConfig, is.String),
    previewer: is.RecordOf(isLoaderConfig, is.String),
    renderer: is.RecordOf(isLoaderConfig, is.String),
    sorter: is.RecordOf(isLoaderConfig, is.String),
    source: is.RecordOf(isLoaderConfig, is.String),
  } satisfies Record<ExtensionKind, Predicate<Record<string, LoaderConfig>>>,
));

export async function loadExtensionConfig(
  path: string | URL,
): Promise<ExtensionConfig> {
  const data = await Deno.readTextFile(path);
  const conf = purifyExtensionConfig(JSON.parse(data));
  resolveExtensionConfig(conf, path);
  return conf;
}

function purifyExtensionConfig(
  data: unknown,
): ExtensionConfig {
  // TODO: Check fields one by one to recover from invalid data
  return maybe(data, isExtensionConfig) ?? {};
}

function resolveExtensionConfig(
  conf: ExtensionConfig,
  base: string | URL,
): void {
  const url = is.String(base) ? toFileUrl(base) : base;
  extensionKinds.forEach((kind) => {
    const loaders = conf[kind] ?? {};
    for (const key in loaders) {
      loaders[key].url = resolve(loaders[key].url, url).toString();
    }
  });
}

function resolve(
  url: string,
  base?: string | URL,
): URL {
  const m = match(builtinPattern, url);
  if (!m) return new URL(url, base);
  const { path } = m;
  return new URL(`../../@fall-builtin/${path}`, import.meta.url);
}

export const _internal = {
  purifyExtensionConfig,
  resolveExtensionConfig,
};
