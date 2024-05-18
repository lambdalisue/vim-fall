import { is, type Predicate } from "jsr:@core/unknownutil@3.18.0";

import { type InputOptions, isInputOptions } from "../view/input.ts";
import { isPickerOptions, type PickerOptions } from "../view/picker.ts";

export type SourcePickerConfig = Partial<{
  transformers: string[];
  projectors: string[];
  renderers: string[];
  previewers: string[];
  actions: string[];
  defaultAction: string;
  options: PickerOptions;
}>;

export type ActionPickerConfig = Partial<{
  transformers: string[];
  projectors: string[];
  renderers: string[];
  previewers: string[];
  options: PickerOptions;
}>;

export type Config = Partial<{
  input: Omit<InputOptions, "input">;
  picker: Partial<{
    source: Partial<Record<string, SourcePickerConfig>>;
    action: Partial<Record<string, ActionPickerConfig>>;
  }>;
  source: Partial<Record<string, Record<string, unknown>>>;
  transformer: Partial<Record<string, Record<string, unknown>>>;
  projector: Partial<Record<string, Record<string, unknown>>>;
  renderer: Partial<Record<string, Record<string, unknown>>>;
  previewer: Partial<Record<string, Record<string, unknown>>>;
  action: Partial<Record<string, Record<string, unknown>>>;
}>;

const isOptions = is.RecordOf(is.Unknown, is.String);

const isSourcePickerConfig = is.PartialOf(is.ObjectOf({
  transformers: is.ArrayOf(is.String),
  projectors: is.ArrayOf(is.String),
  renderers: is.ArrayOf(is.String),
  previewers: is.ArrayOf(is.String),
  actions: is.ArrayOf(is.String),
  defaultAction: is.String,
  options: isPickerOptions,
})) satisfies Predicate<SourcePickerConfig>;

const isActionPickerConfig = is.PartialOf(is.ObjectOf({
  transformers: is.ArrayOf(is.String),
  projectors: is.ArrayOf(is.String),
  renderers: is.ArrayOf(is.String),
  previewers: is.ArrayOf(is.String),
  options: isPickerOptions,
})) satisfies Predicate<ActionPickerConfig>;

export const isConfig = is.PartialOf(is.ObjectOf({
  input: is.OmitOf(isInputOptions, ["input"]),
  picker: is.PartialOf(is.ObjectOf({
    source: is.RecordOf(isSourcePickerConfig, is.String),
    action: is.RecordOf(isActionPickerConfig, is.String),
  })),
  source: is.RecordOf(is.OptionalOf(isOptions), is.String),
  transformer: is.RecordOf(is.OptionalOf(isOptions), is.String),
  projector: is.RecordOf(is.OptionalOf(isOptions), is.String),
  renderer: is.RecordOf(is.OptionalOf(isOptions), is.String),
  previewer: is.RecordOf(is.OptionalOf(isOptions), is.String),
  action: is.RecordOf(is.OptionalOf(isOptions), is.String),
})) satisfies Predicate<Config>;
