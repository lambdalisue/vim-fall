import type { Denops } from "jsr:@denops/std@^7.0.0";
import { send } from "jsr:@denops/std@^7.0.0/helper/keymap";
import { exprQuote as q } from "jsr:@denops/std@^7.0.0/helper/expr_string";
import { assert, ensure, is, maybe } from "jsr:@core/unknownutil@^4.0.0";

import { subscribe } from "../util/event.ts";
import { isDefined } from "../util/collection.ts";
import { type Context as PickerContext, Picker } from "../ui/picker.ts";
import { emitPickerEnter, emitPickerLeave } from "../ui/util/emitter.ts";
import {
  type ExtensionConfig,
  getActionPickerStylConfig,
  getConfigDir,
  getPickerOptions,
  getSourcePickerStyleConfig,
  loadExtensionConfig,
  loadPickerConfig,
  loadStyleConfig,
  type PickerConfig,
  type StyleConfig,
} from "../config/mod.ts";
import {
  type Action,
  type Item,
  loadExtension,
  loadExtensions,
  type Source,
} from "../extension/mod.ts";

type Config = {
  readonly extension: ExtensionConfig;
  readonly picker: PickerConfig;
  readonly style: StyleConfig;
};

type Context = {
  readonly conf: Config;
  readonly name: string;
  readonly cmdline: string;
  readonly collectedItems: readonly Item[];
  readonly restoreContext: PickerContext;
};

let previousContext: Context | undefined;

async function start(
  denops: Denops,
  name: string,
  cmdline: string,
  options: { signal?: AbortSignal } = {},
): Promise<void> {
  const conf = await getConfig(denops);
  const source = await loadExtension(denops, conf.extension, "source", name);
  if (!source) {
    return;
  }
  try {
    return await internalStart(denops, source, cmdline, conf, options);
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") return;
    const m = err.message ?? err;
    setTimeout(() => console.error(`[fall] ${m}`), 50);
  }
}

async function restore(
  denops: Denops,
  options: { signal?: AbortSignal } = {},
): Promise<void> {
  if (!previousContext) {
    console.log(`[fall] No previous context exist`);
    return;
  }
  const {
    conf,
    name,
    cmdline,
    collectedItems,
    restoreContext,
  } = previousContext;
  const source: Source = {
    name,
    stream: (_params) => {
      return ReadableStream.from(collectedItems);
    },
  };
  try {
    return await internalStart(denops, source, cmdline, conf, {
      ...options,
      restoreContext,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") return;
    const m = err.message ?? err;
    setTimeout(() => console.error(`[fall] ${m}`), 50);
  }
}

async function internalStart(
  denops: Denops,
  source: Source,
  cmdline: string,
  conf: Config,
  options: {
    signal?: AbortSignal;
    restoreContext?: PickerContext;
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

  const pickerOptions = getPickerOptions(conf.picker, source.name);
  const actions = await loadExtensions(
    denops,
    conf.extension,
    "action",
    pickerOptions.actions ?? [],
  );
  const projectors = await loadExtensions(
    denops,
    conf.extension,
    "projector",
    pickerOptions.projectors ?? [],
  );
  const renderers = await loadExtensions(
    denops,
    conf.extension,
    "renderer",
    pickerOptions.renderers ?? [],
  );
  const previewers = await loadExtensions(
    denops,
    conf.extension,
    "previewer",
    pickerOptions.previewers ?? [],
  );
  const actionProjectors = await loadExtensions(
    denops,
    conf.extension,
    "projector",
    pickerOptions.actionProjectors ?? [],
  );
  const actionRenderers = await loadExtensions(
    denops,
    conf.extension,
    "renderer",
    pickerOptions.actionRenderers ?? [],
  );
  const actionPreviewers = await loadExtensions(
    denops,
    conf.extension,
    "previewer",
    pickerOptions.actionPreviewers ?? [],
  );
  const sourcePickerStyle = getSourcePickerStyleConfig(conf.style);
  const actionPickerStyle = getActionPickerStylConfig(conf.style);

  const sourcePickerZindex = sourcePickerStyle.style?.zindex ?? 50;
  const actionPickerZindex = actionPickerStyle.style?.zindex ??
    (sourcePickerZindex + 1);

  const sourceStream = await source.stream({ cmdline });
  using sourcePicker = new Picker(
    {
      title: `${source.name} ${cmdline}`.trim(),
      stream: sourceStream,
      projectors,
      renderers,
      previewers,
      selectable: true,
      context: options.restoreContext,
    },
    {
      ...(pickerOptions.options ?? {}),
      style: {
        ...sourcePickerStyle.style,
        zindex: sourcePickerZindex,
      },
      query: sourcePickerStyle.query,
    },
  );

  const actionAliases = pickerOptions.actionAliases ?? {};
  const actionStream = ReadableStream.from(actions.map((v, id) => ({
    id,
    value: actionAliases[v.name] ?? v.name,
    detail: {
      description: v.description,
    },
    decorations: [],
  })));
  using actionPicker = new Picker(
    {
      title: "action",
      stream: actionStream,
      projectors: actionProjectors,
      renderers: actionRenderers,
      previewers: actionPreviewers,
    },
    {
      ...(pickerOptions.options ?? {}),
      style: {
        ...actionPickerStyle.style,
        zindex: actionPickerZindex,
      },
      query: actionPickerStyle.query,
    },
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
        action = actions.find((v) =>
          (actionAliases[v.name] ?? v.name) === actionName
        );
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
            projectedItems: sourcePicker.projectedItems,
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
      conf,
      name: source.name,
      cmdline,
      collectedItems: sourcePicker.collectedItems,
      restoreContext: sourcePicker.context,
    };
  }
}

async function getConfig(denops: Denops): Promise<Config> {
  const configDir = await getConfigDir(denops);
  const [
    extension,
    picker,
    style,
  ] = await Promise.all([
    loadExtensionConfig(configDir),
    loadPickerConfig(configDir),
    loadStyleConfig(configDir),
  ]);
  return { extension, picker, style };
}

export function main(denops: Denops): void {
  denops.dispatcher = {
    ...denops.dispatcher,
    "picker:start": async (args) => {
      assert(args, is.ArrayOf(is.String));
      const name = args.splice(0, 1)[0];
      const cmdline = args.join(" ");
      await start(
        denops,
        ensure(name, is.String),
        ensure(cmdline, is.String),
      );
    },
    "picker:restore": async () => {
      await restore(denops);
    },
  };
}
