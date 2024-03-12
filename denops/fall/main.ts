import type { Denops } from "https://deno.land/x/denops_std@v6.3.0/mod.ts";
import { collect } from "https://deno.land/x/denops_std@v6.3.0/batch/mod.ts";
import { g } from "https://deno.land/x/denops_std@v6.3.0/variable/mod.ts";
import { friendlyCall } from "https://deno.land/x/denops_std@v6.3.0/helper/mod.ts";
import {
  assert,
  ensure,
  is,
} from "https://deno.land/x/unknownutil@v3.16.3/mod.ts";
import { unreachable } from "https://deno.land/x/errorutil@v0.1.1/mod.ts";

import { assign } from "./const.ts";
import { isStartOptions, start } from "./start.ts";
import {
  editExtensionConfig,
  editPickerConfig,
  reloadExtensionConfig,
  reloadPickerConfig,
} from "./config.ts";
import { dispatch, isFallEventName } from "./util/event.ts";

import "./polyfill.ts";

const isConfigType = is.LiteralOneOf(
  ["picker", "extension"] as const,
);

export function main(denops: Denops): void {
  denops.dispatcher = {
    "start": (name, args, options) => {
      return friendlyCall(denops, async () => {
        await init(denops);
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
        await init(denops);
        assert(type, isConfigType);
        switch (type) {
          case "picker":
            await reloadPickerConfig();
            break;
          case "extension":
            await reloadExtensionConfig();
            break;
          default:
            unreachable(type);
        }
      });
    },
    "editConfig": (type) => {
      return friendlyCall(denops, async () => {
        await init(denops);
        assert(type, isConfigType);
        switch (type) {
          case "picker":
            await editPickerConfig(denops);
            break;
          case "extension":
            await editExtensionConfig(denops);
            break;
          default:
            unreachable(type);
        }
      });
    },
  };
}

function init(denops: Denops): Promise<void> {
  if (initWaiter) {
    return initWaiter;
  }
  initWaiter = (async () => {
    const [pickerConfigPath, extensionConfigPath] = await collect(
      denops,
      (denops) => [
        g.get(denops, "fall_picker_config_path"),
        g.get(denops, "fall_extension_config_path"),
      ],
    );
    assign({
      pickerConfigPath: ensure(pickerConfigPath, is.String),
      extensionConfigPath: ensure(extensionConfigPath, is.String),
    });
    await reloadPickerConfig();
    await reloadExtensionConfig();
  })();
  return initWaiter;
}

let initWaiter: Promise<void> | undefined;
