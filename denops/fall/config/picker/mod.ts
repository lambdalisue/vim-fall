import { is, type Predicate } from "jsr:@core/unknownutil@3.18.0";

import { loadBuiltinConfig, loadConfig, mergeConfigs } from "../util.ts";

export type PickerOptions = {
  readonly defaultAction?: string;
  readonly actions?: readonly string[];
  readonly projectors?: readonly string[];
  readonly renderers?: readonly string[];
  readonly previewers?: readonly string[];
  readonly actionProjectors?: readonly string[];
  readonly actionRenderers?: readonly string[];
  readonly actionPreviewers?: readonly string[];
  readonly options?: {
    readonly redraw?: {
      readonly interval?: number;
    };
    readonly itemCollector?: {
      readonly threshold?: number;
    };
  };
};

export type PickerConfig = Readonly<Record<string, PickerOptions>>;

const isPickerOptions = is.PartialOf(is.ObjectOf({
  defaultAction: is.String,
  actions: is.ArrayOf(is.String),
  projectors: is.ArrayOf(is.String),
  renderers: is.ArrayOf(is.String),
  previewers: is.ArrayOf(is.String),
  actionProjectors: is.ArrayOf(is.String),
  actionRenderers: is.ArrayOf(is.String),
  actionPreviewers: is.ArrayOf(is.String),
  options: is.PartialOf(is.ObjectOf({
    redraw: is.PartialOf(is.ObjectOf({
      interval: is.Number,
    })),
    itemCollector: is.PartialOf(is.ObjectOf({
      threshold: is.Number,
    })),
  })),
})) satisfies Predicate<PickerOptions>;

const isPickerConfig = is.RecordOf(
  isPickerOptions,
  is.String,
) satisfies Predicate<PickerConfig>;

export function getPickerOptions(
  conf: PickerConfig,
  name: string,
): PickerOptions {
  const [root] = name.split(":", 1);
  return mergeConfigs(
    conf[""] ?? {},
    conf[root] ?? {},
    conf[name] ?? {},
  );
}

export function loadPickerConfig(
  configDir: string,
): Promise<PickerConfig & { path: string }> {
  return loadConfig(
    "picker",
    isPickerConfig,
    configDir,
  );
}

export function loadBuiltinPickerConfig(
  runtimepath: string,
): Promise<PickerConfig> {
  return loadBuiltinConfig(
    "picker",
    isPickerConfig,
    runtimepath,
  );
}
