import { is, type Predicate } from "jsr:@core/unknownutil@3.18.0";

import { isLayoutParams } from "../view/layout/picker_layout.ts";
import { type InputOptions } from "../view/input.ts";
import { type PickerOptions } from "../view/picker.ts";

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

const isPickerOptions = is.PartialOf(is.ObjectOf({
  layout: is.PartialOf(isLayoutParams),
  redraw: is.PartialOf(is.ObjectOf({
    throttleWait: is.Number,
  })),
  query: is.PartialOf(is.ObjectOf({
    spinner: is.ArrayOf(is.String),
    headSymbol: is.String,
    failSymbol: is.String,
    throttleWait: is.Number,
  })),
  selector: is.PartialOf(is.ObjectOf({
    throttleWait: is.Number,
  })),
  preview: is.PartialOf(is.ObjectOf({
    throttleWait: is.Number,
    debounceWait: is.Number,
  })),
  itemProcessor: is.PartialOf(is.ObjectOf({
    throttleWait: is.Number,
    debounceWait: is.Number,
  })),
})) satisfies Predicate<PickerOptions>;

const isInputOptions = is.PartialOf(is.ObjectOf({
  layout: is.PartialOf(isLayoutParams),
  input: is.PartialOf(is.ObjectOf({
    prompt: is.String,
    text: is.String,
    completion: is.String,
  })),
  updateInterval: is.Number,
})) satisfies Predicate<InputOptions>;

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
