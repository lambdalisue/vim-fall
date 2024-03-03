import type { Denops } from "https://deno.land/x/denops_std@v6.3.0/mod.ts";
import {
  is,
  type PredicateType,
} from "https://deno.land/x/unknownutil@v3.16.3/mod.ts";

import type { Action } from "./types.ts";
import {
  loadActions,
  loadFilters,
  loadPresenters,
  loadPreviewer,
  loadSorters,
  loadSource,
} from "./core/registry.ts";
import { getActionPickerDefault, getItemsPickerDefault } from "./setup.ts";
import { ItemsPicker } from "./ui/items_picker.ts";
import { ActionPicker } from "./ui/action_picker.ts";

export const isStartOptions = is.PartialOf(is.ObjectOf({
  args: is.ArrayOf(is.String),
  filters: is.ArrayOf(is.String),
  sorters: is.ArrayOf(is.String),
  presenters: is.ArrayOf(is.String),
  previewer: is.String,
  actions: is.ArrayOf(is.String),
  actionFilters: is.ArrayOf(is.String),
  actionSorters: is.ArrayOf(is.String),
  actionPresenters: is.ArrayOf(is.String),
}));

export type StartOptions = PredicateType<typeof isStartOptions>;

export async function start(
  denops: Denops,
  name: string,
  options: StartOptions & { signal?: AbortSignal } = {},
): Promise<void> {
  const controller = new AbortController();
  using _controller = {
    [Symbol.dispose]: () => controller.abort(),
  };
  const { signal } = controller;
  options.signal?.addEventListener("abort", () => {
    controller.abort();
  });

  const itemsPickerDefault = getItemsPickerDefault(name);
  const actionPickerDefault = getActionPickerDefault();

  const source = await loadSource(name);
  const previewer = await loadPreviewer(
    options.previewer ?? itemsPickerDefault.previewer,
  );
  const actions = await loadActions(
    options.actions ?? itemsPickerDefault.actions,
  );
  const [
    filters,
    sorters,
    presenters,
    actionFilters,
    actionSorters,
    actionPresenters,
  ] = await Promise.all([
    loadFilters(options.filters ?? itemsPickerDefault.filters),
    loadSorters(options.sorters ?? itemsPickerDefault.sorters),
    loadPresenters(options.presenters ?? itemsPickerDefault.presenters),
    loadFilters(options.actionFilters ?? actionPickerDefault.filters),
    loadSorters(options.actionSorters ?? actionPickerDefault.sorters),
    loadPresenters(options.actionPresenters ?? actionPickerDefault.presenters),
  ]);

  const itemsPicker = new ItemsPicker(
    source,
    Array.from(filters.values()),
    Array.from(sorters.values()),
    Array.from(presenters.values()),
    previewer,
    itemsPickerDefault.params,
  );
  const actionPicker = new ActionPicker(
    actions,
    Array.from(actionFilters.values()),
    Array.from(actionSorters.values()),
    Array.from(actionPresenters.values()),
    actionPickerDefault.params,
  );

  // Listen cursor movement events
  let nextAction: "select" | "default" | string = "select";
  const actionSelect = () => nextAction = "select";
  const actionDefault = () => nextAction = "default";
  addEventListener("fall:action-select", actionSelect);
  addEventListener("fall:action-default", actionDefault);
  using _removeEventListener = {
    [Symbol.dispose]: () => {
      removeEventListener("fall:action-select", actionSelect);
      removeEventListener("fall:action-default", actionDefault);
    },
  };

  while (true) {
    // Pick items
    const itemsPickerResult = await itemsPicker.start(
      denops,
      options.args ?? [],
      {
        signal,
      },
    );
    if (itemsPickerResult.selectedItems == undefined) {
      // Cancel
      await itemsPickerResult.dispose(denops);
      await denops.redraw();
      return;
    }

    let action: Action | undefined;
    if (nextAction == "select") {
      // Pick action
      const actionPickerResult = await actionPicker.start(denops, { signal });
      await itemsPickerResult.dispose(denops);
      await actionPickerResult.dispose(denops);
      if (actionPickerResult.selectedAction == undefined) {
        // Continue
        continue;
      }
      action = actionPickerResult.selectedAction;
    } else if (nextAction == "default") {
      await itemsPickerResult.dispose(denops);
      action = actions.get(itemsPickerDefault.defaultAction);
    } else {
      await itemsPickerResult.dispose(denops);
      action = actions.get(nextAction);
    }
    // Execute action
    if (action) {
      if (await action(denops, itemsPickerResult.selectedItems, { signal })) {
        // Continue
        continue;
      }
    }
    await denops.redraw();
    return;
  }
}
