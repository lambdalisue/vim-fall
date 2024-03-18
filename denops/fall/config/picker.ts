import {
  is,
  maybe,
  type PredicateType,
} from "https://deno.land/x/unknownutil@v3.16.3/mod.ts";

import { isLayoutParams as isPickerLayoutParams } from "../view/layout/prompt_top_preview_right.ts";

export type SourcePickerConfig = PredicateType<typeof isSourcePickerConfig>;
export type ActionPickerConfig = PredicateType<typeof isActionPickerConfig>;
export type PickerConfig = PredicateType<typeof isPickerConfig>;

const isSourcePickerConfig = is.PartialOf(is.ObjectOf({
  actionAlias: is.RecordOf(is.String, is.String),
  defaultAction: is.String,
  actions: is.ArrayOf(is.String),
  filters: is.ArrayOf(is.String),
  previewer: is.String,
  renderers: is.ArrayOf(is.String),
  sorters: is.ArrayOf(is.String),
  options: is.PartialOf(is.ObjectOf({
    layout: is.PartialOf(isPickerLayoutParams),
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
  })),
}));

const isActionPickerConfig = is.PartialOf(is.ObjectOf({
  filters: is.ArrayOf(is.String),
  previewer: is.String,
  renderers: is.ArrayOf(is.String),
  sorters: is.ArrayOf(is.String),
  options: is.PartialOf(is.ObjectOf({
    layout: is.PartialOf(isPickerLayoutParams),
    prompt: is.PartialOf(is.ObjectOf({
      spinner: is.ArrayOf(is.String),
      headSymbol: is.String,
      failSymbol: is.String,
    })),
    preview: is.PartialOf(is.ObjectOf({
      debounceWait: is.Number,
    })),
    updateInterval: is.Number,
  })),
}));

const isPickerConfig = is.PartialOf(is.ObjectOf({
  source: is.RecordOf(isSourcePickerConfig, is.String),
  action: isActionPickerConfig,
}));

export async function loadPickerConfig(
  path: string | URL,
): Promise<PickerConfig> {
  const data = await Deno.readTextFile(path);
  const conf = purifyPickerConfig(JSON.parse(data));
  return conf;
}

function purifyPickerConfig(
  data: unknown,
): PickerConfig {
  // TODO: Check fields one by one to recover from invalid data
  return maybe(data, isPickerConfig) ?? {};
}

export const _internal = {
  purifyPickerConfig,
};
