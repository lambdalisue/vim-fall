import type { Denops } from "https://deno.land/x/denops_std@v6.3.0/mod.ts";
import {
  is,
  type PredicateType,
} from "https://deno.land/x/unknownutil@v3.16.3/mod.ts";

import { importModule, isModule, type Module } from "./core/module.ts";
import { registry } from "./core/registry.ts";
import { isItemsPickerParams } from "./ui/items_picker.ts";
import { isActionPickerParams } from "./ui/action_picker.ts";

const isItemsPickerDefault = is.ObjectOf({
  defaultAction: is.String,
  actions: is.ArrayOf(is.String),
  filters: is.ArrayOf(is.String),
  sorters: is.ArrayOf(is.String),
  presenters: is.ArrayOf(is.String),
  previewer: is.String,
  params: isItemsPickerParams,
});

type ItemsPickerDefault = PredicateType<typeof isItemsPickerDefault>;

const isActionPickerDefault = is.ObjectOf({
  filters: is.ArrayOf(is.String),
  sorters: is.ArrayOf(is.String),
  presenters: is.ArrayOf(is.String),
  params: isActionPickerParams,
});

type ActionPickerDefault = PredicateType<typeof isActionPickerDefault>;

export const isSetupParams = is.ObjectOf({
  picker: is.OptionalOf(is.ObjectOf({
    items: is.OptionalOf(
      is.RecordOf(is.PartialOf(isItemsPickerDefault), is.String),
    ),
    action: is.OptionalOf(is.PartialOf(isActionPickerDefault)),
  })),
  sources: is.OptionalOf(is.RecordOf(isModule, is.String)),
  actions: is.OptionalOf(is.RecordOf(isModule, is.String)),
  filters: is.OptionalOf(is.RecordOf(isModule, is.String)),
  sorters: is.OptionalOf(is.RecordOf(isModule, is.String)),
  presenters: is.OptionalOf(is.RecordOf(isModule, is.String)),
  previewers: is.OptionalOf(is.RecordOf(isModule, is.String)),
});

export type SetupParams = PredicateType<typeof isSetupParams>;

let itemsPickerDefaults: Record<string, ItemsPickerDefault> = {
  "": {
    defaultAction: "open",
    actions: ["debug", "echo", "open", "open:*"],
    filters: ["substring"],
    sorters: ["lexical", "lexical:desc"],
    presenters: [],
    previewer: "path",
    params: {},
  },
};

let actionPickerDefault: ActionPickerDefault = {
  filters: ["substring"],
  sorters: ["lexical", "lexical:desc"],
  presenters: [],
  params: {},
};

export function setup(
  denops: Denops,
  params: SetupParams,
): void {
  if (params.picker?.items) {
    itemsPickerDefaults = {
      ...itemsPickerDefaults,
      ...Object.fromEntries(
        Object.entries(params.picker.items).map(([k, v]) => {
          return [k, { ...(itemsPickerDefaults[k] ?? {}), ...v }];
        }),
      ),
    };
  }
  if (params.picker?.action) {
    actionPickerDefault = {
      ...actionPickerDefault,
      ...params.picker.action,
    };
  }
  if (params.sources) {
    registerModules(denops, params.sources, registry.source);
  }
  if (params.actions) {
    registerModules(denops, params.actions, registry.action);
  }
  if (params.filters) {
    registerModules(denops, params.filters, registry.filter);
  }
  if (params.sorters) {
    registerModules(denops, params.sorters, registry.sorter);
  }
  if (params.presenters) {
    registerModules(denops, params.presenters, registry.presenter);
  }
  if (params.previewers) {
    registerModules(denops, params.previewers, registry.previewer);
  }
}

export function getItemsPickerDefault(name: string): ItemsPickerDefault {
  return {
    ...itemsPickerDefaults[""],
    ...itemsPickerDefaults[name],
  };
}

export function getActionPickerDefault(): ActionPickerDefault {
  return { ...actionPickerDefault };
}

function registerModules<T>(
  denops: Denops,
  modules: Record<string, Module>,
  registry: Map<string, Promise<T | undefined>>,
) {
  for (const [name, module] of Object.entries(modules)) {
    registry.set(name, importModule(denops, module));
  }
}
