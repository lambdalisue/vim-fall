import type { Denops } from "https://deno.land/x/denops_std@v6.3.0/mod.ts";
import { friendlyCall } from "https://deno.land/x/denops_std@v6.3.0/helper/mod.ts";
import {
  assert,
  ensure,
  is,
} from "https://deno.land/x/unknownutil@v3.16.3/mod.ts";
import { isStartOptions, start } from "./start.ts";
import {
  editExtensionConfig,
  editPickerConfig,
  reloadExtensionConfig,
  reloadPickerConfig,
} from "./config.ts";
import { dispatch, isFallEventName } from "./util/event.ts";

import "./polyfill.ts";

export function main(denops: Denops): void {
  denops.dispatcher = {
    "start": (name, args, options) => {
      return friendlyCall(denops, async () => {
        await start(
          denops,
          ensure(name, is.String),
          ensure(args, is.ArrayOf(is.String)),
          ensure(options, is.OptionalOf(isStartOptions)),
        );
      });
    },
    "dispatch": (name, data) => {
      return friendlyCall(denops, () => {
        dispatch(ensure(name, isFallEventName), data);
        return Promise.resolve();
      });
    },
    "reloadConfig": (type) => {
      return friendlyCall(denops, async () => {
        assert(type, is.LiteralOneOf(["picker", "extension"] as const));
        switch (type) {
          case "picker":
            await reloadPickerConfig(denops);
            break;
          case "extension":
            await reloadExtensionConfig(denops);
            break;
        }
      });
    },
    "editConfig": (type) => {
      return friendlyCall(denops, async () => {
        assert(type, is.LiteralOneOf(["picker", "extension"] as const));
        switch (type) {
          case "picker":
            await editPickerConfig(denops);
            break;
          case "extension":
            await editExtensionConfig(denops);
            break;
        }
      });
    },
  };
}
