import type { Denops } from "https://deno.land/x/denops_std@v6.4.0/mod.ts";
import { batch } from "https://deno.land/x/denops_std@v6.4.0/batch/mod.ts";
import * as vars from "https://deno.land/x/denops_std@v6.4.0/variable/mod.ts";
import * as buffer from "https://deno.land/x/denops_std@v6.4.0/buffer/mod.ts";
import * as opt from "https://deno.land/x/denops_std@v6.4.0/option/mod.ts";
import { ensure, is, type Predicate } from "jsr:@core/unknownutil@3.18.0";
import { parse as parseJsonc } from "jsr:@std/jsonc@0.224.0";
import { ensureDir } from "jsr:@std/fs@0.229.0/ensure-dir";
import { copy } from "jsr:@std/fs@0.229.0/copy";
import { exists } from "jsr:@std/fs@0.229.0/exists";
import { dirname } from "jsr:@std/path@0.225.0/dirname";

type Options = Record<string, unknown>;

export type SourcePickerConfig = Partial<{
  filters: string[];
  sorters: string[];
  renderers: string[];
  previewers: string[];
  actions: string[];
  defaultAction: string;
}>;

export type ActionPickerConfig = Partial<{
  filters: string[];
  sorters: string[];
  renderers: string[];
  previewers: string[];
}>;

export type PickerConfig = Partial<{
  source: Partial<Record<string, SourcePickerConfig>>;
  action: Partial<Record<string, ActionPickerConfig>>;
}>;

export type Config = Partial<{
  picker: PickerConfig;
  source: Partial<Record<string, Options>>;
  filter: Partial<Record<string, Options>>;
  sorter: Partial<Record<string, Options>>;
  renderer: Partial<Record<string, Options>>;
  previewer: Partial<Record<string, Options>>;
  action: Partial<Record<string, Options>>;
}>;

const isOptions = is.RecordOf(is.Unknown, is.String) satisfies Predicate<
  Options
>;

const isSourcePickerConfig = is.PartialOf(is.ObjectOf({
  filters: is.ArrayOf(is.String),
  sorters: is.ArrayOf(is.String),
  renderers: is.ArrayOf(is.String),
  previewers: is.ArrayOf(is.String),
  actions: is.ArrayOf(is.String),
  defaultAction: is.String,
})) satisfies Predicate<SourcePickerConfig>;

const isActionPickerConfig = is.PartialOf(is.ObjectOf({
  filters: is.ArrayOf(is.String),
  sorters: is.ArrayOf(is.String),
  renderers: is.ArrayOf(is.String),
  previewers: is.ArrayOf(is.String),
})) satisfies Predicate<ActionPickerConfig>;

const isPickerConfig = is.PartialOf(is.ObjectOf({
  source: is.RecordOf(isSourcePickerConfig, is.String),
  action: is.RecordOf(isActionPickerConfig, is.String),
})) satisfies Predicate<PickerConfig>;

const isConfig = is.PartialOf(is.ObjectOf({
  picker: isPickerConfig,
  source: is.RecordOf(is.OptionalOf(isOptions), is.String),
  filter: is.RecordOf(is.OptionalOf(isOptions), is.String),
  sorter: is.RecordOf(is.OptionalOf(isOptions), is.String),
  renderer: is.RecordOf(is.OptionalOf(isOptions), is.String),
  previewer: is.RecordOf(is.OptionalOf(isOptions), is.String),
  action: is.RecordOf(is.OptionalOf(isOptions), is.String),
})) satisfies Predicate<Config>;

export function getSourcePickerConfig(
  expr: string,
  config: Config,
): SourcePickerConfig {
  const [name] = expr.split(":", 1);
  return {
    ...(config.picker?.source?.[""] ?? {}),
    ...(config.picker?.source?.[name] ?? {}),
    ...(config.picker?.source?.[expr] ?? {}),
  };
}

export function getActionPickerConfig(
  expr: string,
  config: Config,
): ActionPickerConfig {
  const [name] = expr.split(":", 1);
  return {
    ...(config.picker?.action?.[""] ?? {}),
    ...(config.picker?.action?.[name] ?? {}),
    ...(config.picker?.action?.[expr] ?? {}),
  };
}

export function getSourceOptions(
  expr: string,
  config: Config,
): Options {
  const [name] = expr.split(":", 1);
  return {
    ...(config.source?.[""] ?? {}),
    ...(config.source?.[name] ?? {}),
    ...(config.source?.[expr] ?? {}),
  };
}

export function getFilterOptions(
  expr: string,
  config: Config,
): Options {
  const [name] = expr.split(":", 1);
  return {
    ...(config.filter?.[""] ?? {}),
    ...(config.filter?.[name] ?? {}),
    ...(config.filter?.[expr] ?? {}),
  };
}

export function getSorterOptions(
  expr: string,
  config: Config,
): Options {
  const [name] = expr.split(":", 1);
  return {
    ...(config.sorter?.[""] ?? {}),
    ...(config.sorter?.[name] ?? {}),
    ...(config.sorter?.[expr] ?? {}),
  };
}

export function getRendererOptions(
  expr: string,
  config: Config,
): Options {
  const [name] = expr.split(":", 1);
  return {
    ...(config.renderer?.[""] ?? {}),
    ...(config.renderer?.[name] ?? {}),
    ...(config.renderer?.[expr] ?? {}),
  };
}

export function getPreviewerOptions(
  expr: string,
  config: Config,
): Options {
  const [name] = expr.split(":", 1);
  return {
    ...(config.previewer?.[""] ?? {}),
    ...(config.previewer?.[name] ?? {}),
    ...(config.previewer?.[expr] ?? {}),
  };
}

export function getActionOptions(
  expr: string,
  config: Config,
): Options {
  const [name] = expr.split(":", 1);
  return {
    ...(config.action?.[""] ?? {}),
    ...(config.action?.[name] ?? {}),
    ...(config.action?.[expr] ?? {}),
  };
}

export async function getConfigPath(denops: Denops): Promise<string> {
  return ensure(
    await vars.g.get(denops, "fall_config_path"),
    is.String,
  );
}

export async function loadConfig(configPath: string): Promise<Config> {
  try {
    await ensureConfig(configPath);
    const text = await Deno.readTextFile(configPath);
    const data = parseJsonc(text);
    return ensure(data, isConfig);
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      // Do not show warning messages when the file is not found
      return {};
    }
    console.warn(`[fall] Failed to load config file: ${err}`);
    return {};
  }
}

export async function ensureConfig(configPath: string): Promise<void> {
  if (!await exists(configPath)) {
    await ensureDir(dirname(configPath));
    await copy(
      new URL("./assets/config.default.jsonc", import.meta.url),
      configPath,
    );
  }
}

export async function editConfig(
  denops: Denops,
  configPath: string,
): Promise<void> {
  await ensureConfig(configPath);
  await buffer.open(denops, configPath);
  await batch(denops, async (denops) => {
    await opt.autochdir.set(denops, false);
    await opt.bufhidden.set(denops, "wipe");
  });
}
