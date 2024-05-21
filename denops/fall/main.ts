import type { Denops } from "https://deno.land/x/denops_std@v6.4.0/mod.ts";
import * as opt from "https://deno.land/x/denops_std@v6.4.0/option/mod.ts";
import { ensure, is } from "jsr:@core/unknownutil@3.18.0";

import { dispatch, isFallEventName } from "./util/event.ts";
import { restore, start } from "./picker.ts";
import { input, isInputParams } from "./input.ts";
import { editConfig, getConfigPath, loadConfig } from "./config/util.ts";
import { isExtensionType } from "./extension/type.ts";
import {
  discoverExtensionLoaders,
  listExtensionNames,
  registerExtensionLoader,
} from "./extension/loader.ts";
import { hideMsgArea } from "./util/hide_msg_area.ts";

import "./polyfill.ts";

const isDefs = is.RecordOf(is.String, is.String);

export async function main(denops: Denops): Promise<void> {
  const discover = async () => {
    const runtimepath = await opt.runtimepath.get(denops);
    await discoverExtensionLoaders(runtimepath);
  };
  denops.dispatcher = {
    "event:dispatch": (name, data) => {
      dispatch(ensure(name, isFallEventName), data);
    },
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
    "config:edit": async () => {
      const configPath = await getConfigPath(denops);
      await editConfig(denops, configPath);
    },
    "extension:register": async (defs) => {
      await Promise.allSettled(
        Object.entries(ensure(defs, isDefs)).map(([k, v]) =>
          registerExtensionLoader(k, v)
        ),
      );
    },
    "extension:discover": async () => {
      await discover();
    },
    "extension:list": async (type) => {
      const configPath = await getConfigPath(denops);
      const config = await loadConfig(configPath);
      return listExtensionNames(ensure(type, isExtensionType), config);
    },
    "util:input": async (params) => {
      await using _guard = await hideMsgArea(denops);
      return await input(denops, ensure(params, isInputParams));
    },
  };
  await discover();
}
