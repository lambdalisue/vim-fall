import type { Denops } from "https://deno.land/x/denops_std@v6.4.0/mod.ts";
import * as opt from "https://deno.land/x/denops_std@v6.4.0/option/mod.ts";
import { ensure, is } from "jsr:@core/unknownutil@3.18.0";

import { dispatch, isFallEventName } from "./util/event.ts";
import { start } from "./start.ts";
import { editConfig, getConfigPath } from "./config.ts";
import { discover, register } from "./extension.ts";

import "./polyfill.ts";

const isDefs = is.RecordOf(is.String, is.String);

export async function main(denops: Denops): Promise<void> {
  const discoverExtensions = async () => {
    const runtimepath = await opt.runtimepath.get(denops);
    await discover(runtimepath);
  };
  denops.dispatcher = {
    "event:dispatch": (name, data) => {
      dispatch(ensure(name, isFallEventName), data);
    },
    "picker:start": async (name, cmdline) => {
      await start(
        denops,
        ensure(name, is.String),
        ensure(cmdline, is.String),
      );
    },
    "config:edit": async () => {
      const configPath = await getConfigPath(denops);
      await editConfig(denops, configPath);
    },
    "extension:register": async (defs) => {
      await Promise.allSettled(
        Object.entries(ensure(defs, isDefs)).map(([k, v]) => register(k, v)),
      );
    },
    "extension:discover": async () => {
      await discoverExtensions();
    },
  };
  await discoverExtensions();
}
