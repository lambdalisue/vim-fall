import { deepMerge } from "https://deno.land/std@0.218.2/collections/deep_merge.ts";
import {
  ensure,
  is,
  type PredicateType,
} from "https://deno.land/x/unknownutil@v3.16.3/mod.ts";
import builtinConfig from "./picker-config.builtin.json" with { type: "json" };
import defaultConfig from "./picker-config.default.json" with { type: "json" };

import { isLayoutParams as isSourcePickerLayoutParams } from "../view/layout/prompt_top_preview_right.ts";
import { isLayoutParams as isActionPickerLayoutParams } from "../view/layout/prompt_top.ts";

type SourcePickerConfig = PredicateType<typeof isSourcePickerConfig>;
type ActionPickerConfig = PredicateType<typeof isActionPickerConfig>;
type PickerConfig = PredicateType<typeof isPickerConfig>;

const isSourcePickerConfig = is.ObjectOf({
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

const isActionPickerConfig = is.ObjectOf({
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

const isPickerConfig = is.ObjectOf({
  source: is.RecordOf(is.PartialOf(isSourcePickerConfig), is.String),
  action: isActionPickerConfig,
});

export function getPickerConfig(): PickerConfig {
  return pickerConfig;
}

export function getSourcePickerConfig(name: string): SourcePickerConfig {
  const conf = getPickerConfig();
  const d = conf.source[""];
  const c = conf.source[name] ?? {};
  return deepMerge(d, c, { arrays: "replace" });
}

export function getActionPickerConfig(): ActionPickerConfig {
  const conf = getPickerConfig();
  return conf.action;
}

export async function loadPickerConfig(path: string): Promise<void> {
  const customConfig = JSON.parse(await Deno.readTextFile(path));
  pickerConfig = ensure(
    deepMerge(builtinConfig, customConfig, {
      arrays: "replace",
    }),
    isPickerConfig,
  );
}

let pickerConfig: PickerConfig = deepMerge(builtinConfig, defaultConfig);

export { defaultConfig };
