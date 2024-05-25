import { is, type Predicate } from "jsr:@core/unknownutil@3.18.0";

import { isBorder } from "../../view/layout/border.ts";
import { isDivider } from "../../view/layout/divider.ts";
import { type LayoutParams as InputLayoutParams } from "../../view/layout/input_layout.ts";
import { type LayoutParams as PickerLayoutParams } from "../../view/layout/picker_layout.ts";
import { loadConfig, mergeConfigs } from "../util.ts";

export type PickerStyleConfig = {
  readonly layout?: Partial<Omit<PickerLayoutParams, "title">>;
  readonly query?: {
    readonly spinner?: readonly string[];
    readonly headSymbol?: string;
    readonly failSymbol?: string;
  };
};

export type InputStyleConfig = {
  readonly layout?: Partial<Omit<InputLayoutParams, "title">>;
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
  layout: is.PartialOf(is.ObjectOf({
    width: is.OptionalOf(is.Number),
    widthRatio: is.Number,
    widthMin: is.Number,
    widthMax: is.Number,
    height: is.OptionalOf(is.Number),
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
  layout: is.PartialOf(is.ObjectOf({
    width: is.OptionalOf(is.Number),
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
