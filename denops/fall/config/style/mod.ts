import { is, type Predicate } from "jsr:@core/unknownutil@3.18.0";

import type { Border } from "../../ui/util/border.ts";
import type { Divider } from "../../ui/util/divider.ts";
import type { Options as InputOptions } from "../../ui/input.ts";
import type { Options as PickerOptions } from "../../ui/picker.ts";
import { loadConfig, mergeConfigs } from "../util.ts";

export const isBorder = is.UnionOf([
  is.LiteralOneOf(["none", "ascii", "single", "double", "rounded"] as const),
  is.UniformTupleOf(8, is.String),
]) satisfies Predicate<Border>;

export const isDivider = is
  .UnionOf([
    is.LiteralOneOf(["none", "ascii", "single", "double", "dashed"] as const),
    is.UniformTupleOf(6, is.String),
  ]) satisfies Predicate<Divider>;

export type PickerStyleConfig = {
  readonly style?: Partial<PickerOptions["style"]>;
  readonly query?: {
    readonly spinner?: readonly string[];
    readonly headSymbol?: string;
    readonly failSymbol?: string;
  };
};

export type InputStyleConfig = {
  readonly style?: Partial<InputOptions["style"]>;
};

export type StyleConfig = {
  readonly picker?: {
    readonly ""?: PickerStyleConfig;
    readonly source?: PickerStyleConfig;
    readonly action?: PickerStyleConfig;
  };
  readonly input?: Partial<InputStyleConfig>;
};

const isPickerStyleConfig = is.PartialOf(is.ObjectOf({
  style: is.PartialOf(is.ObjectOf({
    widthRatio: is.Number,
    widthMin: is.Number,
    widthMax: is.Number,
    heightRatio: is.Number,
    heightMin: is.Number,
    heightMax: is.Number,
    previewRatio: is.Number,
    border: is.OptionalOf(isBorder),
    divider: is.OptionalOf(isDivider),
    zindex: is.OptionalOf(is.Number),
  })),
  query: is.PartialOf(is.ObjectOf({
    spinner: is.ArrayOf(is.String),
    headSymbol: is.String,
    failSymbol: is.String,
  })),
})) satisfies Predicate<PickerStyleConfig>;

const isInputStyleConfig = is.PartialOf(is.ObjectOf({
  style: is.PartialOf(is.ObjectOf({
    widthRatio: is.Number,
    widthMin: is.Number,
    widthMax: is.Number,
    border: is.OptionalOf(isBorder),
    zindex: is.OptionalOf(is.Number),
  })),
})) satisfies Predicate<InputStyleConfig>;

const isStyleConfig = is.PartialOf(is.ObjectOf({
  picker: is.PartialOf(is.ObjectOf({
    "": isPickerStyleConfig,
    source: isPickerStyleConfig,
    action: isPickerStyleConfig,
  })),
  input: isInputStyleConfig,
})) satisfies Predicate<StyleConfig>;

export function getSourcePickerStyleConfig(
  style: StyleConfig,
): PickerStyleConfig {
  return mergeConfigs(
    style.picker?.[""] ?? {},
    style.picker?.source ?? {},
  );
}

export function getActionPickerStylConfig(
  style: StyleConfig,
): PickerStyleConfig {
  return mergeConfigs(
    style.picker?.[""] ?? {},
    style.picker?.action ?? {},
  );
}

export function getInputStyleConfig(style: StyleConfig): InputStyleConfig {
  return style.input ?? {};
}

export function loadStyleConfig(
  configDir: string,
): Promise<StyleConfig & { path: string }> {
  return loadConfig(
    "style",
    isStyleConfig,
    configDir,
  );
}
