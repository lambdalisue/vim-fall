import { deepMerge } from "https://deno.land/std@0.218.2/collections/deep_merge.ts";
import {
  ensure,
  is,
  type PredicateType,
} from "https://deno.land/x/unknownutil@v3.16.3/mod.ts";
import builtin from "./config.picker.json" with { type: "json" };

import { isLayoutParams as isSourcePickerLayoutParams } from "../view/layout/prompt_top_preview_right.ts";
import { isLayoutParams as isActionPickerLayoutParams } from "../view/layout/prompt_top.ts";

export type SourcePickerConfig = PredicateType<typeof isSourcePickerConfig>;
export type ActionPickerConfig = PredicateType<typeof isActionPickerConfig>;
export type PickerConfig = PredicateType<typeof isPickerConfig>;

export const isSourcePickerConfig = is.ObjectOf({
  defaultAction: is.String,
  actions: is.ArrayOf(is.String),
  previewer: is.String,
  processors: is.ArrayOf(is.String),
  renderers: is.ArrayOf(is.String),
  options: is.OptionalOf(is.PartialOf(is.ObjectOf({
    layout: is.PartialOf(isSourcePickerLayoutParams),
    itemCollector: is.PartialOf(is.ObjectOf({
      chunkSize: is.Number,
    })),
    prompt: is.PartialOf(is.ObjectOf({
      spinner: is.ArrayOf(is.String),
      headSymbol: is.String,
      failSymbol: is.String,
    })),
    preview: is.PartialOf(is.ObjectOf({
      debounceWait: is.Number,
    })),
    updateInterval: is.Number,
  }))),
});

export const isActionPickerConfig = is.ObjectOf({
  processors: is.ArrayOf(is.String),
  renderers: is.ArrayOf(is.String),
  options: is.OptionalOf(is.PartialOf(is.ObjectOf({
    layout: is.PartialOf(isActionPickerLayoutParams),
    prompt: is.PartialOf(is.ObjectOf({
      spinner: is.ArrayOf(is.String),
      headSymbol: is.String,
      failSymbol: is.String,
    })),
    updateInterval: is.Number,
  }))),
});

export const isPickerConfig = is.ObjectOf({
  source: is.RecordOf(is.PartialOf(isSourcePickerConfig), is.String),
  action: isActionPickerConfig,
});

export function getPickerConfig(): PickerConfig {
  return pickerConfig;
}

export function getSourcePickerConfig(name: string): SourcePickerConfig {
  const d = pickerConfig.source[""];
  const c = (pickerConfig as PickerConfig).source[name] ?? {};
  return deepMerge(d, c, { arrays: "replace" });
}

export function getActionPickerConfig(): ActionPickerConfig {
  return pickerConfig.action;
}

export function resetPickerConfig(): void {
  Object.assign(pickerConfig, builtin);
}

export async function loadPickerConfig(url: URL): Promise<void> {
  const response = await fetch(url);
  const data = ensure(response.json(), isPickerConfig);
  Object.assign(
    pickerConfig,
    deepMerge(pickerConfig, data, { arrays: "replace" }),
  );
}

const pickerConfig = deepMerge({}, builtin, {
  arrays: "replace",
}) satisfies PickerConfig;
