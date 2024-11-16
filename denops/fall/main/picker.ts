import type { Denops, Entrypoint } from "jsr:@denops/std@^7.3.2";
import { ensurePromise } from "jsr:@core/asyncutil@^1.2.0/ensure-promise";
import { assert, ensure, is } from "jsr:@core/unknownutil@^4.3.0";
import type { DetailUnit } from "jsr:@vim-fall/core@^0.2.1/item";

import type { GlobalConfig, ItemPickerParams } from "../config.ts";
import {
  getActionPickerParams,
  getGlobalConfig,
  getItemPickerParams,
  listItemPickerNames,
  loadUserConfig,
} from "../config.ts";
import { isOptions, isParams, isStringArray } from "../util/predicate.ts";
import { action as buildActionSource } from "../extension/source/action.ts";
import { Picker } from "../picker.ts";

let zindex = 50;

export const main: Entrypoint = (denops) => {
  denops.dispatcher = {
    ...denops.dispatcher,
    "picker:command": async (args) => {
      await loadUserConfig(denops);
      // Split the command arguments
      const [name, ...sourceArgs] = ensure(args, isStringArray);
      // Load user config
      const itemPickerParams = getItemPickerParams(name);
      if (!itemPickerParams) {
        throw new Error(`Config for picker "${name}" is not found`);
      }
      await startPicker(
        denops,
        sourceArgs,
        itemPickerParams,
        { signal: denops.interrupted },
      );
    },
    "picker:command:complete": async (arglead, cmdline, cursorpos) => {
      await loadUserConfig(denops);
      assert(arglead, is.String);
      assert(cmdline, is.String);
      assert(cursorpos, is.Number);
      return listItemPickerNames().filter((name) => name.startsWith(arglead));
    },
    // _screen is not used
    "picker:start": async (args, _screen, params, options) => {
      await loadUserConfig(denops);
      assert(args, isStringArray);
      assert(params, isParams);
      assert(options, isOptions);
      return await startPicker(denops, args, params, options);
    },
  };
};

async function startPicker(
  denops: Denops,
  args: string[],
  params: ItemPickerParams<DetailUnit, string> & GlobalConfig,
  { signal }: { signal?: AbortSignal } = {},
): Promise<void | true> {
  await using stack = new AsyncDisposableStack();
  const itemPicker = stack.use(new Picker({ ...params, zindex }));
  zindex += Picker.ZINDEX_ALLOCATION;
  stack.defer(() => {
    zindex -= Picker.ZINDEX_ALLOCATION;
  });
  const actionPicker = stack.use(
    new Picker({
      name: "@action",
      source: buildActionSource(params.actions),
      ...getActionPickerParams(),
      zindex,
    }),
  );
  zindex += Picker.ZINDEX_ALLOCATION;
  stack.defer(() => {
    zindex -= Picker.ZINDEX_ALLOCATION;
  });

  stack.use(await itemPicker.open(denops, { signal }));
  while (true) {
    // Redraw the screen to clean up the closed action picker
    await denops.cmd("redraw");

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

    // Execute the action
    const action = params.actions[actionName];
    if (!action) {
      throw new Error(`Action "${actionName}" is not found`);
    }
    const actionParams = {
      // for 'submatch' action
      _submatchContext: {
        globalConfig: getGlobalConfig(),
        pickerParams: params,
        // not used
        screen: {
          width: 0,
          height: 0,
        },
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
