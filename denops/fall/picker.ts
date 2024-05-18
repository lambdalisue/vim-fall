import type { Denops } from "https://deno.land/x/denops_std@v6.4.0/mod.ts";
import { send } from "https://deno.land/x/denops_std@v6.4.0/helper/keymap.ts";
import { exprQuote as q } from "https://deno.land/x/denops_std@v6.4.0/helper/expr_string.ts";
import { is, maybe } from "jsr:@core/unknownutil@3.18.0";

import { subscribe } from "./util/event.ts";
import { isDefined } from "./util/collection.ts";
import { Picker, type PickerContext } from "./view/picker.ts";
import { emitPickerEnter, emitPickerLeave } from "./view/util/emitter.ts";
import type { Config } from "./config/type.ts";
import {
  getActionPickerConfig,
  getConfigPath,
  getSourcePickerConfig,
  loadConfig,
} from "./config/util.ts";
import type { Action, Item, Source } from "./extension/type.ts";
import { getExtension, getExtensions } from "./extension/loader.ts";

interface Context {
  name: string;
  cmdline: string;
  collectedItems: Item[];
  sourcePickerContext: PickerContext;
  actionPickerContext: PickerContext;
}

export async function start(
  denops: Denops,
  cmdline: string,
  sourceName: string,
  options: { signal?: AbortSignal } = {},
): Promise<void> {
  const configPath = await getConfigPath(denops);
  const config = await loadConfig(configPath);
  const source = await getExtension(denops, "source", sourceName, config);
  if (!source) {
    return;
  }
  return internalStart(
    denops,
    cmdline,
    source,
    config,
    options,
  );
}

export async function restore(
  denops: Denops,
  options: { signal?: AbortSignal } = {},
): Promise<void> {
  if (!previousContext) {
    return;
  }
  const {
    name,
    cmdline,
    collectedItems,
    sourcePickerContext,
    actionPickerContext,
  } = previousContext;
  const configPath = await getConfigPath(denops);
  const config = await loadConfig(configPath);
  const source: Source = {
    name,
    stream: (_params) => {
      return ReadableStream.from(collectedItems);
    },
  };
  return internalStart(
    denops,
    cmdline,
    source,
    config,
    { ...options, sourcePickerContext, actionPickerContext },
  );
}

async function internalStart(
  denops: Denops,
  cmdline: string,
  source: Source,
  config: Config,
  options: {
    signal?: AbortSignal;
    sourcePickerContext?: PickerContext;
    actionPickerContext?: PickerContext;
  } = {},
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

  const stream = await source.stream({ cmdline });
  if (!stream) {
    return;
  }

  const sourcePickerConfig = getSourcePickerConfig(name, config);
  const actionPickerConfig = getActionPickerConfig(name, config);
  const actions = await getExtensions(
    denops,
    "action",
    sourcePickerConfig.actions ?? [],
    config,
  );
  const transformers = await getExtensions(
    denops,
    "transformer",
    sourcePickerConfig.transformers ?? [],
    config,
  );
  const projectors = await getExtensions(
    denops,
    "projector",
    sourcePickerConfig.projectors ?? [],
    config,
  );
  const renderers = await getExtensions(
    denops,
    "renderer",
    sourcePickerConfig.renderers ?? [],
    config,
  );
  const previewers = await getExtensions(
    denops,
    "previewer",
    sourcePickerConfig.previewers ?? [],
    config,
  );
  const actionTransformers = await getExtensions(
    denops,
    "transformer",
    actionPickerConfig.transformers ?? [],
    config,
  );
  const actionProjectors = await getExtensions(
    denops,
    "projector",
    actionPickerConfig.projectors ?? [],
    config,
  );
  const actionRenderers = await getExtensions(
    denops,
    "renderer",
    actionPickerConfig.renderers ?? [],
    config,
  );
  const actionPreviewers = await getExtensions(
    denops,
    "previewer",
    actionPickerConfig.previewers ?? [],
    config,
  );

  await using sourcePicker = new Picker(
    `${source.name} ${cmdline}`.trim(),
    stream,
    transformers,
    projectors,
    renderers,
    previewers,
    {
      ...(sourcePickerConfig.options ?? {}),
      selectable: true,
    },
    options.sourcePickerContext,
  );

  const actionStream = ReadableStream.from(actions.map((v, id) => ({
    id,
    value: v.name,
    detail: {
      content: v.description,
    },
    decorations: [],
  })));
  await using actionPicker = new Picker(
    "actions",
    actionStream,
    actionTransformers,
    actionProjectors,
    actionRenderers,
    actionPreviewers,
    {
      ...(actionPickerConfig.options ?? {}),
      selectable: false,
    },
    options.actionPickerContext,
  );

  // Listen cursor movement events
  let nextAction: "@select" | "@default" | string = "@select";
  stack.use(subscribe("action-invoke", (action) => {
    nextAction = action;
    send(denops, q`\<CR>`).catch((err) => {
      // Fail silently
      const msg = err.message ?? err;
      console.debug(
        `[fall] Failed to send <CR> in 'action-invoke' event: ${msg}`,
      );
    });
  }));

  // Open source picker
  await using _sourcePickerOpenGuard = await sourcePicker.open(denops);

  const startSourcePicker = async (
    denops: Denops,
    { signal }: { signal: AbortSignal },
  ) => {
    const name = `source:${source.name}`;
    await emitPickerEnter(denops, name);
    try {
      return await sourcePicker.start(denops, { signal });
    } finally {
      await emitPickerLeave(denops, name);
    }
  };
  const startActionPicker = async (
    denops: Denops,
    { signal }: { signal: AbortSignal },
  ) => {
    const name = `action`;
    await emitPickerEnter(denops, name);
    try {
      return await actionPicker.start(denops, { signal });
    } finally {
      await emitPickerLeave(denops, name);
    }
  };
  try {
    while (true) {
      // Pick items
      if (await startSourcePicker(denops, { signal })) {
        // Cancel
        await denops.redraw();
        return;
      }

      let action: Action | undefined;
      if (nextAction == "@select") {
        await using _actionPickerOpenGuard = await actionPicker.open(denops);
        if (await startActionPicker(denops, { signal })) {
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
        action = actions.find((v) =>
          v.name === sourcePickerConfig.defaultAction
        );
      } else {
        action = actions.find((v) => v.name === nextAction);
      }
      // Execute action
      if (action) {
        if (
          await action.trigger({
            cursorItem: sourcePicker.cursorItem,
            selectedItems: sourcePicker.selectedItems,
            availableItems: sourcePicker.processedItems,
          }, { signal })
        ) {
          // Continue
          continue;
        }
      }
      await denops.redraw();
      return;
    }
  } finally {
    previousContext = {
      name: source.name,
      cmdline,
      collectedItems: sourcePicker.collectedItems,
      sourcePickerContext: sourcePicker.context,
      actionPickerContext: actionPicker.context,
    };
  }
}

let previousContext: Context | undefined;
