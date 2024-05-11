import type { Denops } from "https://deno.land/x/denops_std@v6.4.0/mod.ts";
import { send } from "https://deno.land/x/denops_std@v6.4.0/helper/keymap.ts";
import { exprQuote as q } from "https://deno.land/x/denops_std@v6.4.0/helper/expr_string.ts";
import type { Action } from "https://deno.land/x/fall_core@v0.11.0/mod.ts";
import { is, maybe } from "jsr:@core/unknownutil@3.18.0";

import { subscribe } from "./util/event.ts";
import { isDefined } from "./util/collection.ts";
import { SourcePicker } from "./view/source_picker.ts";
import { ActionPicker } from "./view/action_picker.ts";
import {
  getActionPickerConfig,
  getConfigPath,
  getSourcePickerConfig,
  loadConfig,
} from "./config.ts";
import * as extension from "./extension.ts";

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
  const config = await loadConfig(configPath);
  const source = await extension.getSource(denops, expr, config);
  if (!source) {
    return;
  }
  const spc = getSourcePickerConfig(expr, config);
  const apc = getActionPickerConfig(expr, config);
  const actions = new Map(
    await extension.getExtensions(
      denops,
      spc.actions ?? [],
      config,
      extension.getAction,
    ),
  );
  const transformers = (await extension.getExtensions(
    denops,
    spc.transformers ?? [],
    config,
    extension.getTransformer,
  )).map(([_, v]) => v);
  const projectors = (await extension.getExtensions(
    denops,
    spc.projectors ?? [],
    config,
    extension.getProjector,
  )).map(([_, v]) => v);
  const renderers = (await extension.getExtensions(
    denops,
    spc.renderers ?? [],
    config,
    extension.getRenderer,
  )).map(([_, v]) => v);
  const previewers = (await extension.getExtensions(
    denops,
    spc.previewers ?? [],
    config,
    extension.getPreviewer,
  )).map(([_, v]) => v);
  const actionTransformers = (await extension.getExtensions(
    denops,
    apc.transformers ?? [],
    config,
    extension.getTransformer,
  )).map(([_, v]) => v);
  const actionProjectors = (await extension.getExtensions(
    denops,
    apc.projectors ?? [],
    config,
    extension.getProjector,
  )).map(([_, v]) => v);
  const actionRenderers = (await extension.getExtensions(
    denops,
    apc.renderers ?? [],
    config,
    extension.getRenderer,
  )).map(([_, v]) => v);
  const actionPreviewers = (await extension.getExtensions(
    denops,
    apc.previewers ?? [],
    config,
    extension.getPreviewer,
  )).map(([_, v]) => v);

  await using itemsPicker = await SourcePicker.create(
    denops,
    cmdline,
    ` ${expr}${cmdline ? " " + cmdline + " " : ""} `,
    source,
    transformers,
    projectors,
    renderers,
    previewers,
    spc.options ?? {},
  );
  if (!itemsPicker) {
    return;
  }

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
        actionTransformers,
        actionProjectors,
        actionRenderers,
        actionPreviewers,
        apc.options ?? {},
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
        await action.trigger({
          cursorItem: itemsPicker.cursorItem,
          selectedItems: itemsPicker.selectedItems,
          availableItems: itemsPicker.availableItems,
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
