import type { Denops } from "https://deno.land/x/denops_std@v6.4.0/mod.ts";
import { ensure, is } from "https://deno.land/x/unknownutil@v3.16.3/mod.ts";

import { init } from "./main/init.ts";
import { dispatch, isFallEventName } from "./util/event.ts";
import { isStartOptions, start } from "./main/start.ts";
import { editConfig, reloadConfig } from "./main/config.ts";

import "./polyfill.ts";

const isConfigType = is.LiteralOneOf(
  ["picker", "extension"] as const,
);

export function main(denops: Denops): void {
  denops.dispatcher = {
    "dispatch": (name, data) => {
      dispatch(ensure(name, isFallEventName), data);
      return Promise.resolve();
    },
    "start": async (name, args, options) => {
      await init(denops);
      await start(
        denops,
        ensure(name, is.String),
        ensure(args, is.ArrayOf(is.String)),
        ensure(options, is.OptionalOf(isStartOptions)),
      );
    },
    "editConfig": async (type) => {
      await init(denops);
      await editConfig(denops, ensure(type, isConfigType));
    },
    "reloadConfig": async (type) => {
      await init(denops);
      await reloadConfig(ensure(type, isConfigType));
    },
  };
}
