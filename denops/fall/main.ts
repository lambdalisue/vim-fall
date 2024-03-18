import type { Denops } from "https://deno.land/x/denops_std@v6.4.0/mod.ts";
import {
  assert,
  ensure,
  is,
} from "https://deno.land/x/unknownutil@v3.16.3/mod.ts";
import { unreachable } from "https://deno.land/x/errorutil@v0.1.1/mod.ts";

import { init } from "./main/init.ts";
import { dispatch, isFallEventName } from "./util/event.ts";
import { isStartOptions, start } from "./main/start.ts";
import {
  editExtensionConfig,
  editPickerConfig,
  reloadExtensionConfig,
  reloadPickerConfig,
} from "./main/config.ts";

import "./polyfill.ts";

const isConfigType = is.LiteralOneOf(
  ["extension", "picker"] as const,
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
    "reloadConfig": async (type) => {
      assert(type, isConfigType);
      await init(denops);
      switch (type) {
        case "extension":
          await reloadExtensionConfig(denops);
          break;
        case "picker":
          await reloadPickerConfig(denops);
          break;
        default:
          unreachable(type);
      }
    },
    "editConfig": async (type) => {
      await init(denops);
      assert(type, isConfigType);
      await init(denops);
      switch (type) {
        case "extension":
          await editExtensionConfig(denops);
          break;
        case "picker":
          await editPickerConfig(denops);
          break;
        default:
          unreachable(type);
      }
    },
  };
}
