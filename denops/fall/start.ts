import type { Denops } from "https://deno.land/x/denops_std@v6.4.0/mod.ts";
import { send } from "https://deno.land/x/denops_std@v6.4.0/helper/keymap.ts";
import { exprQuote as q } from "https://deno.land/x/denops_std@v6.4.0/helper/expr_string.ts";
import type { Action } from "https://deno.land/x/fall_core@v0.5.1/mod.ts";
import {
  is,
  maybe,
  type PredicateType,
} from "https://deno.land/x/unknownutil@v3.16.3/mod.ts";

import {
  getActionPickerConfig,
  getSourcePickerConfig,
} from "./config/picker.ts";
import { loadExtension, loadExtensions } from "./extension/loader.ts";
import { subscribe } from "./util/event.ts";
import { isDefined } from "./util/collection.ts";
import { SourcePicker } from "./view/picker/source.ts";
import { ActionPicker } from "./view/picker/action.ts";

export const isStartOptions = is.PartialOf(is.ObjectOf({
  filters: is.ArrayOf(is.String),
  previewer: is.String,
  renderers: is.ArrayOf(is.String),
  sorters: is.ArrayOf(is.String),
  actions: is.ArrayOf(is.String),
  actionFilters: is.ArrayOf(is.String),
  actionRenderers: is.ArrayOf(is.String),
  actionSorters: is.ArrayOf(is.String),
}));

export type StartOptions = PredicateType<typeof isStartOptions>;

export async function start(
  denops: Denops,
  name: string,
  args: string[],
  options: StartOptions & { signal?: AbortSignal } = {},
): Promise<void> {
  await using stack = new AsyncDisposableStack();
  const controller = new AbortController();
  const signal = AbortSignal.any(
    [controller.signal, options.signal].filter(isDefined),
  );
  stack.defer(() => {
    try {
      controller.abort();
    } catch {
      // Fail silently
    }
  });

  const itemsPickerConfig = getSourcePickerConfig(name);
  const actionPickerConfig = getActionPickerConfig();
  const source = await loadExtension("source", name);
  if (!source) {
    return;
  }
  const previewer = await loadExtension(
    "previewer",
    options.previewer ?? itemsPickerConfig.previewer,
  );
  const [
    actions,
    filters,
    renderers,
    sorters,
    actionFilters,
    actionRenderers,
    actionSorters,
  ] = await Promise.all([
    loadExtensions(
      "action",
      options.actions ?? itemsPickerConfig.actions,
    ),
    loadExtensions(
      "filter",
      options.filters ?? itemsPickerConfig.filters,
    ),
    loadExtensions(
      "renderer",
      options.renderers ?? itemsPickerConfig.renderers,
    ),
    loadExtensions(
      "sorter",
      options.sorters ?? itemsPickerConfig.sorters,
    ),
    loadExtensions(
      "filter",
      options.actionFilters ?? actionPickerConfig.filters,
    ),
    loadExtensions(
      "renderer",
      options.actionRenderers ?? actionPickerConfig.renderers,
    ),
    loadExtensions(
      "sorter",
      options.actionSorters ?? actionPickerConfig.sorters,
    ),
  ]);

  const aliasedActions = new Map(
    [...actions.entries()].map(([name, action]) => {
      const alias: string | undefined = itemsPickerConfig.actionAlias[name];
      if (alias) {
        return [alias, action];
      }
      return [name, action];
    }),
  );

  await using itemsPicker = await SourcePicker.create(
    denops,
    args,
    name,
    source,
    filters,
    previewer,
    renderers,
    sorters,
    itemsPickerConfig.options ?? {},
  );

  // Listen cursor movement events
  let nextAction: "@select" | "@default" | string = "@select";
  stack.use(subscribe("action-invoke", (action) => {
    nextAction = action;
    send(denops, q`\<CR>`).catch((err) => {
      // Fail silently
      console.debug(
        `[fall] Failed to send <CR> in 'action-invoke' event: ${err}`,
      );
    });
  }));

  while (true) {
    // Pick items
    if (await itemsPicker.start(denops, { signal })) {
      // Cancel
      await denops.redraw();
      return;
    }

    let action: Action | undefined;
    if (nextAction == "@select") {
      await using actionPicker = await ActionPicker.create(
        denops,
        aliasedActions,
        actionFilters,
        actionRenderers,
        actionSorters,
        actionPickerConfig.options ?? {},
      );
      if (await actionPicker.start(denops, { signal })) {
        // Continue
        await denops.redraw();
        continue;
      }
      const actionName = maybe(actionPicker.cursorItem?.id, is.String);
      if (!actionName) {
        // Cancel
        return;
      }
      action = aliasedActions.get(actionName);
    } else if (nextAction == "@default") {
      action = actions.get(itemsPickerConfig.defaultAction);
    } else {
      action = actions.get(nextAction);
    }
    // Execute action
    if (action) {
      if (
        await action.invoke(denops, {
          cursorItem: itemsPicker.cursorItem,
          selectedItems: itemsPicker.selectedItems,
          processedItems: itemsPicker.processedItems,
        })
      ) {
        // Continue
        continue;
      }
    }
    await denops.redraw();
    return;
  }
}
