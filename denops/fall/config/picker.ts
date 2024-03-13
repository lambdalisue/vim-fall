import { deepMerge } from "https://deno.land/std@0.218.2/collections/deep_merge.ts";
import {
  ensure,
  is,
  type PredicateType,
} from "https://deno.land/x/unknownutil@v3.16.3/mod.ts";
import builtinConfig from "./picker-config.builtin.json" with { type: "json" };
import defaultConfig from "./picker-config.default.json" with { type: "json" };

import { getPickerConfigPath } from "../const.ts";

import { isLayoutParams as isSourcePickerLayoutParams } from "../view/layout/prompt_top_preview_right.ts";
import { isLayoutParams as isActionPickerLayoutParams } from "../view/layout/prompt_top.ts";

const isSourcePickerConfig = is.ObjectOf({
  actionAlias: is.RecordOf(is.String, is.String),
  defaultAction: is.String,
  actions: is.ArrayOf(is.String),
  filters: is.ArrayOf(is.String),
  previewer: is.String,
  renderers: is.ArrayOf(is.String),
  sorters: is.ArrayOf(is.String),
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

type SourcePickerConfig = PredicateType<typeof isSourcePickerConfig>;

const isActionPickerConfig = is.ObjectOf({
  filters: is.ArrayOf(is.String),
  renderers: is.ArrayOf(is.String),
  sorters: is.ArrayOf(is.String),
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

type ActionPickerConfig = PredicateType<typeof isActionPickerConfig>;

const isPickerConfig = is.ObjectOf({
  source: is.RecordOf(is.PartialOf(isSourcePickerConfig), is.String),
  action: isActionPickerConfig,
});

type PickerConfig = PredicateType<typeof isPickerConfig>;

const isPartialPickerConfig = is.ObjectOf({
  source: is.RecordOf(is.PartialOf(isSourcePickerConfig), is.String),
  action: is.PartialOf(isActionPickerConfig),
});

type PartialPickerConfig = PredicateType<typeof isPartialPickerConfig>;

export function getPickerConfig(): PickerConfig {
  return ensure(
    deepMerge(builtinConfig, customConfig, {
      arrays: "replace",
    }),
    isPickerConfig,
  );
}

export function getSourcePickerConfig(name: string): SourcePickerConfig {
  const conf = getPickerConfig();
  const d = conf.source[""];
  const c = conf.source[name] ?? conf.source[name.split(":", 1)[0]] ?? {};
  return deepMerge(d, c, { arrays: "replace" });
}

export function getActionPickerConfig(): ActionPickerConfig {
  const conf = getPickerConfig();
  return conf.action;
}

export async function loadPickerConfig(): Promise<void> {
  try {
    customConfig = ensure(
      JSON.parse(await Deno.readTextFile(getPickerConfigPath())),
      isPartialPickerConfig,
    );
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      customConfig = defaultConfig;
      return;
    }
    throw err;
  }
}

let customConfig: PartialPickerConfig = defaultConfig;

export { defaultConfig };
