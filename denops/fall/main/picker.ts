import type { Denops } from "https://deno.land/x/denops_std@v6.4.0/mod.ts";
import { send } from "https://deno.land/x/denops_std@v6.4.0/helper/keymap.ts";
import { exprQuote as q } from "https://deno.land/x/denops_std@v6.4.0/helper/expr_string.ts";
import { ensure, is, maybe } from "jsr:@core/unknownutil@3.18.0";

import { subscribe } from "../util/event.ts";
import { isDefined } from "../util/collection.ts";
import { hideMsgArea } from "../util/hide_msg_area.ts";
import { Picker, type PickerContext } from "../view/picker.ts";
import { emitPickerEnter, emitPickerLeave } from "../view/util/emitter.ts";
import { type ExtensionConfig } from "../config/extension.ts";
import { getPickerOptions, type PickerConfig } from "../config/picker.ts";
import {
  getActionPickerStylConfig,
  getSourcePickerStyleConfig,
  type StyleConfig,
} from "../config/style.ts";
import {
  getConfigDir,
  loadExtensionConfig,
  loadPickerConfig,
  loadStyleConfig,
} from "../config/loader.ts";
import type { Action, Item, Source } from "../extension/type.ts";
import { loadExtension, loadExtensions } from "../extension/loader.ts";

type Context = {
  name: string;
  cmdline: string;
  collectedItems: readonly Item[];
  sourcePickerContext: PickerContext;
  actionPickerContext: PickerContext;
};

let previousContext: Context | undefined;

async function start(
  denops: Denops,
  name: string,
  cmdline: string,
  options: { signal?: AbortSignal } = {},
): Promise<void> {
  const configDir = await getConfigDir(denops);
  const [extensionConf, pickerConf, styleConf] = await Promise.all([
    loadExtensionConfig(configDir),
    loadPickerConfig(configDir),
    loadStyleConfig(configDir),
  ]);
  const source = await loadExtension(denops, extensionConf, "source", name);
  if (!source) {
    return;
  }
  return internalStart(
    denops,
    cmdline,
    source,
    extensionConf,
    pickerConf,
    styleConf,
    options,
  );
}

async function restore(
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
  const configDir = await getConfigDir(denops);
  const [extensionConf, pickerConf, styleConf] = await Promise.all([
    loadExtensionConfig(configDir),
    loadPickerConfig(configDir),
    loadStyleConfig(configDir),
  ]);
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
    extensionConf,
    pickerConf,
    styleConf,
    { ...options, sourcePickerContext, actionPickerContext },
  );
}

async function internalStart(
  denops: Denops,
  cmdline: string,
  source: Source,
  extensionConf: ExtensionConfig,
  pickerConf: PickerConfig,
  styleConf: StyleConfig,
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

  const pickerOptions = getPickerOptions(pickerConf, source.name);
  const actions = await loadExtensions(
    denops,
    extensionConf,
    "action",
    pickerOptions.actions ?? [],
  );
  const transformers = await loadExtensions(
    denops,
    extensionConf,
    "transformer",
    pickerOptions.transformers ?? [],
  );
  const projectors = await loadExtensions(
    denops,
    extensionConf,
    "projector",
    pickerOptions.projectors ?? [],
  );
  const renderers = await loadExtensions(
    denops,
    extensionConf,
    "renderer",
    pickerOptions.renderers ?? [],
  );
  const previewers = await loadExtensions(
    denops,
    extensionConf,
    "previewer",
    pickerOptions.previewers ?? [],
  );
  const actionTransformers = await loadExtensions(
    denops,
    extensionConf,
    "transformer",
    pickerOptions.transformers ?? [],
  );
  const actionProjectors = await loadExtensions(
    denops,
    extensionConf,
    "projector",
    pickerOptions.actionProjectors ?? [],
  );
  const actionRenderers = await loadExtensions(
    denops,
    extensionConf,
    "renderer",
    pickerOptions.actionRenderers ?? [],
  );
  const actionPreviewers = await loadExtensions(
    denops,
    extensionConf,
    "previewer",
    pickerOptions.actionPreviewers ?? [],
  );

  const sourcePickerStyle = getSourcePickerStyleConfig(styleConf);
  const actionPickerStyle = getActionPickerStylConfig(styleConf);

  await using sourcePicker = new Picker(
    `${source.name} ${cmdline}`.trim(),
    stream,
    transformers,
    projectors,
    renderers,
    previewers,
    {
      ...(pickerOptions.options ?? {}),
      layout: sourcePickerStyle.layout,
      query: sourcePickerStyle.query,
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
      ...(pickerOptions.options ?? {}),
      layout: actionPickerStyle.layout,
      query: actionPickerStyle.query,
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
      const m = err.message ?? err;
      console.debug(
        `[fall] Failed to send <CR> in 'action-invoke' event: ${m}`,
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
        const actionName = maybe(actionPicker.cursorItem?.value, is.String);
        if (!actionName) {
          // Cancel
          return;
        }
        action = actions.find((v) => v.name === actionName);
      } else if (nextAction == "@default") {
        action = actions.find((v) => v.name === pickerOptions.defaultAction);
      } else {
        action = actions.find((v) => v.name === nextAction);
      }
      // Execute action
      if (action) {
        if (
          await action.invoke({
            cursorItem: sourcePicker.cursorItem,
            selectedItems: sourcePicker.selectedItems,
            processedItems: sourcePicker.processedItems,
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

export function main(denops: Denops): void {
  denops.dispatcher = {
    ...denops.dispatcher,
    "picker:start": async (name, cmdline) => {
      await using _guard = await hideMsgArea(denops);
      await start(
        denops,
        ensure(name, is.String),
        ensure(cmdline, is.String),
      );
    },
    "picker:restore": async () => {
      await using _guard = await hideMsgArea(denops);
      await restore(denops);
    },
  };
}
