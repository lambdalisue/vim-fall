import type { Denops } from "https://deno.land/x/denops_std@v6.4.0/mod.ts";
import { send } from "https://deno.land/x/denops_std@v6.4.0/helper/keymap.ts";
import { exprQuote as q } from "https://deno.land/x/denops_std@v6.4.0/helper/expr_string.ts";
import type { Action } from "https://deno.land/x/fall_core@v0.8.0/mod.ts";
import { is, maybe } from "jsr:@core/unknownutil@3.18.0";

import { subscribe } from "./util/event.ts";
import { isDefined } from "./util/collection.ts";
import { SourcePicker } from "./view/picker/source.ts";
import { ActionPicker } from "./view/picker/action.ts";
import {
  ensureConfig,
  getActionPickerConfig,
  getConfigPath,
  getSourcePickerConfig,
  loadConfig,
} from "./config.ts";
import * as extension from "./extension.ts";

const defaultActions: string[] = ["open"];
const defaultFilters: string[] = ["substring"];
const defaultSorters: string[] = ["lexical"];
const defaultRenderers: string[] = [];
const defaultPreviewers: string[] = ["text"];
const defaultActionFilters: string[] = ["substring"];
const defaultActionSorters: string[] = [];
const defaultActionRenderers: string[] = [];
const defaultActionPreviewers: string[] = ["text"];

export async function start(
  denops: Denops,
  expr: string,
  cmdline: string,
  options: { signal?: AbortSignal } = {},
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

  const configPath = await getConfigPath(denops);
  const conf = await loadConfig(configPath);
  const source = extension.getSource(expr, conf);
  if (!source) {
    return;
  }
  const spc = getSourcePickerConfig(expr, conf);
  const apc = getActionPickerConfig(expr, conf);
  const actions = new Map(
    (spc.actions ?? defaultActions).map((
      v,
    ) => [v, extension.getAction(v, conf)]),
  );
  const filters = (spc.filters ?? defaultFilters)
    .map((v) => extension.getFilter(v, conf));
  const sorters = (spc.sorters ?? defaultSorters)
    .map((v) => extension.getSorter(v, conf));
  const renderers = (spc.renderers ?? defaultRenderers)
    .map((v) => extension.getRenderer(v, conf));
  const previewers = (spc.previewers ?? defaultPreviewers)
    .map((v) => extension.getPreviewer(v, conf));
  const actionFilters = (apc.filters ?? defaultActionFilters)
    .map((v) => extension.getFilter(v, conf));
  const actionSorters = (apc.sorters ?? defaultActionSorters)
    .map((v) => extension.getSorter(v, conf));
  const actionRenderers = (apc.renderers ?? defaultActionRenderers)
    .map((v) => extension.getRenderer(v, conf));
  const actionPreviewers = (apc.previewers ?? defaultActionPreviewers)
    .map((v) => extension.getPreviewer(v, conf));

  await using itemsPicker = await SourcePicker.create(
    denops,
    cmdline,
    ` ${expr}${cmdline ? cmdline + " " : ""} `,
    source,
    filters,
    sorters,
    renderers,
    previewers,
    {},
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
        actions,
        actionFilters,
        actionSorters,
        actionRenderers,
        actionPreviewers,
        {},
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
      action = actions.get(actionName);
    } else if (nextAction == "@default") {
      action = actions.get(spc.defaultAction ?? "");
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
        }, { signal })
      ) {
        // Continue
        continue;
      }
    }
    await denops.redraw();
    return;
  }
}
