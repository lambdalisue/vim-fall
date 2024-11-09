import type { Denops, Entrypoint } from "jsr:@denops/std@^7.3.0";
import * as opt from "jsr:@denops/std@^7.3.0/option";
import { collect } from "jsr:@denops/std@^7.3.0/batch";
import { ensurePromise } from "jsr:@core/asyncutil@^1.2.0/ensure-promise";
import {
  as,
  assert,
  ensure,
  is,
  type Predicate,
} from "jsr:@core/unknownutil@^4.3.0";

import type { Size } from "../../@fall/coordinator.ts";
import type { GlobalConfig, ItemPickerParams } from "../../@fall/config.ts";
import {
  getActionPickerParams,
  getGlobalConfig,
  getItemPickerParams,
  listItemPickerNames,
  loadUserConfig,
} from "../config.ts";
import { Picker } from "../picker.ts";

let initialized: Promise<void>;
let zindex = 50;

export const main: Entrypoint = (denops) => {
  denops.dispatcher = {
    ...denops.dispatcher,
    "picker:command": async (args) => {
      await init(denops);
      // Split the command arguments
      const [name, ...sourceArgs] = ensure(args, isArgs);
      // Load user config
      const itemPickerParams = getItemPickerParams(name);
      if (!itemPickerParams) {
        throw new Error(`Config for picker "${name}" is not found`);
      }
      // Collect options from Vim
      const [width, height] = await collect(denops, (denops) => [
        opt.columns.get(denops),
        opt.lines.get(denops),
      ]);
      const screen = { width, height };
      await startPicker(
        denops,
        sourceArgs,
        screen,
        itemPickerParams,
        { signal: denops.interrupted },
      );
    },
    "picker:command:complete": async (arglead, cmdline, cursorpos) => {
      await init(denops);
      assert(arglead, is.String);
      assert(cmdline, is.String);
      assert(cursorpos, is.Number);
      return listItemPickerNames().filter((name) => name.startsWith(arglead));
    },
    "picker:start": async (args, screen, params, options) => {
      await init(denops);
      assert(args, isArgs);
      assert(screen, isScreen);
      assert(params, isParams);
      assert(options, isOptions);
      return await startPicker(denops, args, screen, params, options);
    },
  };
};

async function init(denops: Denops): Promise<void> {
  if (initialized) {
    return initialized;
  }
  const path = await denops.eval("expand(g:fall_config_path)") as string;
  return (initialized = loadUserConfig(denops, path));
}

async function startPicker(
  denops: Denops,
  args: string[],
  screen: Size,
  params: ItemPickerParams<unknown, string> & GlobalConfig,
  { signal }: { signal?: AbortSignal } = {},
): Promise<void | true> {
  await using stack = new AsyncDisposableStack();
  const pickerParams = { screen, ...params };
  const itemPicker = stack.use(new Picker({ ...pickerParams, zindex }));
  const actionPicker = stack.use(
    new Picker({
      name: "@action",
      screen,
      source: {
        collect: async function* () {
          yield* Object.entries(params.actions).map(([name, action], id) => ({
            id,
            value: name,
            detail: action,
          }));
        },
      },
      ...getActionPickerParams(),
      zindex: zindex + 3,
    }),
  );

  zindex += 6;
  stack.defer(() => {
    zindex -= 6;
  });
  stack.use(await itemPicker.open(denops, { signal }));
  while (true) {
    // Select items
    const resultItem = await itemPicker.start(
      denops,
      { args },
      { signal },
    );
    if (!resultItem) {
      // Cancelled
      return true;
    }

    // Select an action
    let actionName: string;
    if (resultItem.action === "@select") {
      // Open the action picker to select an action
      await using _guardActionPicker = await actionPicker.open(denops, {
        signal,
      });
      const resultAction = await actionPicker.start(
        denops,
        { args: [] },
        { signal },
      );
      if (!resultAction) {
        // Return to the item picker
        continue;
      }
      if (!resultAction.item) {
        // Cancelled
        return true;
      }
      actionName = resultAction.item.value;
    } else if (resultItem.action) {
      actionName = resultItem.action;
    } else {
      // Default action
      actionName = params.defaultAction;
    }

    // Execute the action AFTER the picker is closed
    const action = params.actions[actionName];
    if (!action) {
      throw new Error(`Action "${actionName}" is not found`);
    }
    const actionParams = {
      // for 'submatch' action
      _submatchContext: {
        screen,
        globalConfig: getGlobalConfig(),
        pickerParams: params,
      },
      ...resultItem,
    };
    if (await ensurePromise(action.invoke(denops, actionParams, { signal }))) {
      // Picker should not be closed
      continue;
    }
    // Successfully completed
    return;
  }
}

const isArgs = is.ArrayOf(is.String);

const isScreen = is.ObjectOf({
  width: is.Number,
  height: is.Number,
}) satisfies Predicate<Size>;

const isParams = is.ObjectOf({
  name: is.String,
  source: is.Any,
  actions: is.Any,
  defaultAction: is.String,
  matchers: is.Any,
  sorters: as.Optional(is.Any),
  renderers: as.Optional(is.Any),
  previewers: as.Optional(is.Any),
  coordinator: is.Any,
  theme: is.Any,
}) satisfies Predicate<ItemPickerParams<unknown, string> & GlobalConfig>;

const isOptions = is.ObjectOf({
  signal: as.Optional(is.InstanceOf(AbortSignal)),
});
