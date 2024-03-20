import {
  is,
  type PredicateType,
} from "https://deno.land/x/unknownutil@v3.16.3/mod.ts";

import { isBorder } from "../view/layout/border.ts";
import { isDivider } from "../view/layout/divider.ts";
import { isLayoutParams as isPickerLayoutParams } from "../view/layout/prompt_top_preview_right.ts";

type PickerLayoutParams = Partial<PredicateType<typeof isPickerLayoutParams>>;
type SourcePickerConfigOptions = PredicateType<
  typeof isPickerConfigOptions
>;
export type SourcePickerConfig = PredicateType<typeof isSourcePickerConfig>;
export type ActionPickerConfig = PredicateType<typeof isActionPickerConfig>;
export type PickerConfig = PredicateType<typeof isPickerConfig>;

const isStringStringRecord = is.RecordOf(is.String, is.String);

const isStringArray = is.ArrayOf(is.String);

const isPickerConfigOptions = is.PartialOf(is.ObjectOf({
  layout: is.PartialOf(isPickerLayoutParams),
  itemCollector: is.PartialOf(is.ObjectOf({
    chunkSize: is.Number,
  })),
  prompt: is.PartialOf(is.ObjectOf({
    spinner: isStringArray,
    headSymbol: is.String,
    failSymbol: is.String,
  })),
  preview: is.PartialOf(is.ObjectOf({
    debounceWait: is.Number,
  })),
  updateInterval: is.Number,
}));

const isSourcePickerConfig = is.PartialOf(is.ObjectOf({
  actionAlias: isStringStringRecord,
  defaultAction: is.String,
  actions: isStringArray,
  filters: isStringArray,
  previewer: is.String,
  renderers: isStringArray,
  sorters: isStringArray,
  options: isPickerConfigOptions,
}));

const isActionPickerConfig = is.PartialOf(is.ObjectOf({
  filters: is.ArrayOf(is.String),
  previewer: is.String,
  renderers: is.ArrayOf(is.String),
  sorters: is.ArrayOf(is.String),
  options: isPickerConfigOptions,
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

function purifyLayoutParams(
  name: string,
  data: unknown,
): PickerLayoutParams {
  if (!is.Record(data)) {
    console.warn(
      `[fall] The "source.${name}.options.layout" field is not a valid object.`,
    );
    return {};
  }
  const layout: PickerLayoutParams = {};
  if (data.title) {
    if (!is.String(data.title)) {
      console.warn(
        `[fall] The "source.${name}.options.layout.title" field is not a string.`,
      );
    } else {
      layout.title = data.title;
    }
  }
  if (data.width) {
    if (!is.Number(data.width)) {
      console.warn(
        `[fall] The "source.${name}.options.layout.width" field is not a number.`,
      );
    } else {
      layout.width = data.width;
    }
  }
  if (data.widthRatio) {
    if (!is.Number(data.widthRatio)) {
      console.warn(
        `[fall] The "source.${name}.options.layout.widthRatio" field is not a number.`,
      );
    } else {
      layout.widthRatio = data.widthRatio;
    }
  }
  if (data.widthMin) {
    if (!is.Number(data.widthMin)) {
      console.warn(
        `[fall] The "source.${name}.options.layout.widthMin" field is not a number.`,
      );
    } else {
      layout.widthMin = data.widthMin;
    }
  }
  if (data.widthMax) {
    if (!is.Number(data.widthMax)) {
      console.warn(
        `[fall] The "source.${name}.options.layout.widthMax" field is not a number.`,
      );
    } else {
      layout.widthMax = data.widthMax;
    }
  }
  if (data.height) {
    if (!is.Number(data.height)) {
      console.warn(
        `[fall] The "source.${name}.options.layout.height" field is not a number.`,
      );
    } else {
      layout.height = data.height;
    }
  }
  if (data.heightRatio) {
    if (!is.Number(data.heightRatio)) {
      console.warn(
        `[fall] The "source.${name}.options.layout.heightRatio" field is not a number.`,
      );
    } else {
      layout.heightRatio = data.heightRatio;
    }
  }
  if (data.heightMin) {
    if (!is.Number(data.heightMin)) {
      console.warn(
        `[fall] The "source.${name}.options.layout.heightMin" field is not a number.`,
      );
    } else {
      layout.heightMin = data.heightMin;
    }
  }
  if (data.heightMax) {
    if (!is.Number(data.heightMax)) {
      console.warn(
        `[fall] The "source.${name}.options.layout.heightMax" field is not a number.`,
      );
    } else {
      layout.heightMax = data.heightMax;
    }
  }
  if (data.previewRatio) {
    if (!is.Number(data.previewRatio)) {
      console.warn(
        `[fall] The "source.${name}.options.layout.previewRatio" field is not a number.`,
      );
    } else {
      layout.previewRatio = data.previewRatio;
    }
  }
  if (data.border) {
    if (!isBorder(data.border)) {
      console.warn(
        `[fall] The "source.${name}.options.layout.border" field is not a valid border.`,
      );
    } else {
      layout.border = data.border;
    }
  }
  if (data.divider) {
    if (!isDivider(data.divider)) {
      console.warn(
        `[fall] The "source.${name}.options.layout.divider" field is not a valid divider.`,
      );
    } else {
      layout.divider = data.divider;
    }
  }
  if (data.zindex) {
    if (!is.Number(data.zindex)) {
      console.warn(
        `[fall] The "source.${name}.options.layout.zindex" field is not a number.`,
      );
    } else {
      layout.zindex = data.zindex;
    }
  }
  return layout;
}

function purifyPickerConfigOptions(
  name: string,
  data: unknown,
): SourcePickerConfigOptions {
  if (!is.Record(data)) {
    console.warn(
      `[fall] The "source.${name}.options" field is not a valid object.`,
    );
    return {};
  }
  const options: SourcePickerConfigOptions = {};
  if (data.layout) {
    if (!is.Record(data.layout)) {
      console.warn(
        `[fall] The "source.${name}.options.layout" field is not a valid object.`,
      );
    } else {
      options.layout = purifyLayoutParams(name, data.layout);
    }
  }
  if (data.itemCollector) {
    if (!is.Record(data.itemCollector)) {
      console.warn(
        `[fall] The "source.${name}.options.itemCollector" field is not a valid object.`,
      );
    } else {
      options.itemCollector = {};
      if (is.Number(data.itemCollector.chunkSize)) {
        options.itemCollector.chunkSize = data.itemCollector.chunkSize;
      }
    }
  }
  if (data.prompt) {
    if (!is.Record(data.prompt)) {
      console.warn(
        `[fall] The "source.${name}.options.prompt" field is not a valid object.`,
      );
    } else {
      options.prompt = {};
      if (data.prompt.spinner) {
        if (!isStringArray(data.prompt.spinner)) {
          console.warn(
            `[fall] The "source.${name}.options.prompt.spinner" field is not a string array.`,
          );
        } else {
          options.prompt.spinner = data.prompt.spinner;
        }
      }
      if (data.prompt.headSymbol) {
        if (!is.String(data.prompt.headSymbol)) {
          console.warn(
            `[fall] The "source.${name}.options.prompt.headSymbol" field is not a string.`,
          );
        } else {
          options.prompt.headSymbol = data.prompt.headSymbol;
        }
      }
      if (data.prompt.failSymbol) {
        if (!is.String(data.prompt.failSymbol)) {
          console.warn(
            `[fall] The "source.${name}.options.prompt.failSymbol" field is not a string.`,
          );
        } else {
          options.prompt.failSymbol = data.prompt.failSymbol;
        }
      }
    }
  }
  if (data.preview) {
    if (!is.Record(data.preview)) {
      console.warn(
        `[fall] The "source.${name}.options.preview" field is not a valid object.`,
      );
    } else {
      options.preview = {};
      if (data.preview.debounceWait) {
        if (!is.Number(data.preview.debounceWait)) {
          console.warn(
            `[fall] The "source.${name}.options.preview.debounceWait" field is not a number.`,
          );
        } else {
          options.preview.debounceWait = data.preview.debounceWait;
        }
      }
    }
  }
  if (data.updateInterval) {
    if (!is.Number(data.updateInterval)) {
      console.warn(
        `[fall] The "source.${name}.options.updateInterval" field is not a number.`,
      );
    } else {
      options.updateInterval = data.updateInterval;
    }
  }
  return options;
}

function purifySourcePickerConfig(
  name: string,
  data: unknown,
): SourcePickerConfig {
  if (!is.Record(data)) {
    console.warn(
      `[fall] The "source.${name}" field is not a valid object.`,
    );
    return {};
  }
  const source: SourcePickerConfig = {};
  if (data.actionAlias) {
    if (!isStringStringRecord(data.actionAlias)) {
      console.warn(
        `[fall] The "source.${name}.actionAlias" is not a valid object.`,
      );
    } else {
      source.actionAlias = data.actionAlias;
    }
  }
  if (data.defaultAction) {
    if (!is.String(data.defaultAction)) {
      console.warn(
        `[fall] The "source.${name}.defaultAction" field is not a string.`,
      );
    } else {
      source.defaultAction = data.defaultAction;
    }
  }
  if (data.actions) {
    if (!isStringArray(data.actions)) {
      console.warn(
        `[fall] The "source.${name}.actions" field is not a string array.`,
      );
    } else {
      source.actions = data.actions;
    }
  }
  if (data.filters) {
    if (!isStringArray(data.filters)) {
      console.warn(
        `[fall] The "source.${name}.filters" field is not a string array.`,
      );
    } else {
      source.filters = data.filters;
    }
  }
  if (data.previewer) {
    if (!is.String(data.previewer)) {
      console.warn(
        `[fall] The "source.${name}.previewer" field is not a string.`,
      );
    } else {
      source.previewer = data.previewer;
    }
  }
  if (data.renderers) {
    if (!isStringArray(data.renderers)) {
      console.warn(
        `[fall] The "source.${name}.renderers" field is not a string array.`,
      );
    } else {
      source.renderers = data.renderers;
    }
  }
  if (data.sorters) {
    if (!isStringArray(data.sorters)) {
      console.warn(
        `[fall] The "source.${name}.sorters" field is not a string array.`,
      );
    } else {
      source.sorters = data.sorters;
    }
  }
  if (data.options) {
    if (!is.Record(data.options)) {
      console.warn(
        `[fall] The "source.${name}.options" field is not a valid object.`,
      );
    } else {
      source.options = purifyPickerConfigOptions(name, data.options);
    }
  }
  return source;
}

function purifyActionPickerConfig(
  data: unknown,
): ActionPickerConfig {
  if (!is.Record(data)) {
    console.warn(
      `[fall] The "action" field is not a valid object.`,
    );
    return {};
  }
  const action: ActionPickerConfig = {};
  if (data.filters) {
    if (!isStringArray(data.filters)) {
      console.warn(
        `[fall] The "action.filters" field is not a string array.`,
      );
    } else {
      action.filters = data.filters;
    }
  }
  if (data.previewer) {
    if (!is.String(data.previewer)) {
      console.warn(
        `[fall] The "action.previewer" field is not a string.`,
      );
    } else {
      action.previewer = data.previewer;
    }
  }
  if (data.renderers) {
    if (!isStringArray(data.renderers)) {
      console.warn(
        `[fall] The "action.renderers" field is not a string array.`,
      );
    } else {
      action.renderers = data.renderers;
    }
  }
  if (data.sorters) {
    if (!isStringArray(data.sorters)) {
      console.warn(
        `[fall] The "action.sorters" field is not a string array.`,
      );
    } else {
      action.sorters = data.sorters;
    }
  }
  if (data.options) {
    if (!is.Record(data.options)) {
      console.warn(
        `[fall] The "action.options" field is not a valid object.`,
      );
    } else {
      action.options = purifyPickerConfigOptions(name, data.options);
    }
  }
  return action;
}

function purifyPickerConfig(
  data: unknown,
): PickerConfig {
  if (!is.Record(data)) {
    console.warn(
      `[fall] The given picker config is not an object.`,
    );
    return {};
  }
  const conf: PickerConfig = {};
  if (data.source) {
    if (!is.Record(data.source)) {
      console.warn(`[fall] The source field is not an object.`);
    } else {
      conf.source = {};
      Object.entries(data.source).forEach(([name, source]) => {
        if (!is.Record(source)) {
          console.warn(`[fall] The "source.${name}" is not a valid object.`);
          return;
        }
        conf.source![name] = purifySourcePickerConfig(name, source);
      });
    }
  }
  if (data.action) {
    if (!is.Record(data.action)) {
      console.warn(`[fall] The action field is not an object.`);
    } else {
      conf.action = purifyActionPickerConfig(data.action);
    }
  }
  return conf;
}

export const _internal = {
  purifyLayoutParams,
  purifyPickerConfigOptions,
  purifySourcePickerConfig,
  purifyActionPickerConfig,
  purifyPickerConfig,
};
