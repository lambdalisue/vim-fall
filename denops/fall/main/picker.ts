import type { Denops, Entrypoint } from "jsr:@denops/std@^7.3.2";
import * as opt from "jsr:@denops/std@^7.3.2/option";
import { collect } from "jsr:@denops/std@^7.3.2/batch";
import { ensurePromise } from "jsr:@core/asyncutil@^1.2.0/ensure-promise";
import { as, assert, ensure, is } from "jsr:@core/unknownutil@^4.3.0";
import type { Size } from "jsr:@vim-fall/core@^0.2.1/coordinator";
import type { DetailUnit } from "jsr:@vim-fall/core@^0.2.1/item";

import type { GlobalConfig, ItemPickerParams } from "../config.ts";
import {
  getActionPickerParams,
  getGlobalConfig,
  getItemPickerParams,
  listItemPickerNames,
  loadUserConfig,
} from "../config.ts";
import {
  isOptions,
  isParams,
  isScreen,
  isStringArray,
} from "../util/predicate.ts";
import { Picker } from "../picker.ts";

let initialized: Promise<void> | undefined;
let zindex = 50;

export const main: Entrypoint = (denops) => {
  denops.dispatcher = {
    ...denops.dispatcher,
    "picker:command": async (args) => {
      await init(denops);
      // Split the command arguments
      const [name, ...sourceArgs] = ensure(args, isStringArray);
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
      assert(args, isStringArray);
      assert(screen, isScreen);
      assert(params, isParams);
      assert(options, isOptions);
      return await startPicker(denops, args, screen, params, options);
    },
    "picker:reload": async (recache) => {
      initialized = undefined;
      assert(recache, as.Optional(is.Boolean));
      await init(denops, true, recache);
    },
  };
};

async function init(
  denops: Denops,
  reload?: boolean,
  recache?: boolean,
): Promise<void> {
  if (initialized) {
    return initialized;
  }
  const path = await denops.eval("expand(g:fall_config_path)") as string;
  if (recache) {
    const cmd = new Deno.Command(Deno.execPath(), {
      args: ["cache", "--reload", "--allow-import", path],
      stdin: "null",
      stdout: "piped",
      stderr: "piped",
    });
    const { success, stderr, stdout } = await cmd.output();
    const decoder = new TextDecoder();
    if (success) {
      console.log(`Cache reload succeeded: ${path}\n${decoder.decode(stdout)}`);
    } else {
      console.error(`Cache reload failed: ${path}\n${decoder.decode(stderr)}`);
    }
  }
  const suffix = reload ? `#${performance.now()}` : undefined;
  return (initialized = loadUserConfig(denops, path, { suffix }));
}

async function startPicker(
  denops: Denops,
  args: string[],
  screen: Size,
  params: ItemPickerParams<DetailUnit, string> & GlobalConfig,
  { signal }: { signal?: AbortSignal } = {},
): Promise<void | true> {
  await using stack = new AsyncDisposableStack();
  const pickerParams = { screen, ...params };
  const itemPicker = stack.use(new Picker({ ...pickerParams, zindex }));
  zindex += Picker.ZINDEX_ALLOCATION;
  stack.defer(() => {
    zindex -= Picker.ZINDEX_ALLOCATION;
  });
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
