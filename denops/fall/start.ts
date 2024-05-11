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
} from "./config/util.ts";
import { getExtension, getExtensions } from "./extension/loader.ts";

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
  const source = await getExtension(denops, "source", expr, config);
  if (!source) {
    return;
  }
  const spc = getSourcePickerConfig(expr, config);
  const apc = getActionPickerConfig(expr, config);
  const actions = await getExtensions(
    denops,
    "action",
    spc.actions ?? [],
    config,
  );
  const transformers = await getExtensions(
    denops,
    "transformer",
    spc.transformers ?? [],
    config,
  );
  const projectors = await getExtensions(
    denops,
    "projector",
    spc.projectors ?? [],
    config,
  );
  const renderers = await getExtensions(
    denops,
    "renderer",
    spc.renderers ?? [],
    config,
  );
  const previewers = await getExtensions(
    denops,
    "previewer",
    spc.previewers ?? [],
    config,
  );
  const actionTransformers = await getExtensions(
    denops,
    "transformer",
    apc.transformers ?? [],
    config,
  );
  const actionProjectors = await getExtensions(
    denops,
    "projector",
    apc.projectors ?? [],
    config,
  );
  const actionRenderers = await getExtensions(
    denops,
    "renderer",
    apc.renderers ?? [],
    config,
  );
  const actionPreviewers = await getExtensions(
    denops,
    "previewer",
    apc.previewers ?? [],
    config,
  );

  await using sourcePicker = await SourcePicker.create(
    cmdline,
    source,
    transformers,
    projectors,
    renderers,
    previewers,
    spc.options ?? {},
  );
  if (!sourcePicker) {
    return;
  }
  await using actionPicker = ActionPicker.create(
    actions,
    actionTransformers,
    actionProjectors,
    actionRenderers,
    actionPreviewers,
    apc.options ?? {},
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

  // Open source picker
  await using _sourcePickerOpenGuard = await sourcePicker.open(denops);

  while (true) {
    // Pick items
    if (await sourcePicker.start(denops, { signal })) {
      // Cancel
      await denops.redraw();
      return;
    }

    let action: Action | undefined;
    if (nextAction == "@select") {
      await using _actionPickerOpenGuard = await actionPicker.open(denops);
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
      action = actions.find((v) => v.name === actionName);
    } else if (nextAction == "@default") {
      action = actions.find((v) => v.name === spc.defaultAction);
    } else {
      action = actions.find((v) => v.name === nextAction);
    }
    // Execute action
    if (action) {
      if (
        await action.trigger({
          cursorItem: sourcePicker.cursorItem,
          selectedItems: sourcePicker.selectedItems,
          availableItems: sourcePicker.availableItems,
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
