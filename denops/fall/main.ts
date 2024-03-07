import type { Denops } from "https://deno.land/x/denops_std@v6.3.0/mod.ts";
import { friendlyCall } from "https://deno.land/x/denops_std@v6.3.0/helper/mod.ts";
import { ensure, is } from "https://deno.land/x/unknownutil@v3.16.3/mod.ts";
import { isStartOptions, start } from "./start.ts";
import { dispatch, isFallEventName } from "./util/event.ts";

import "./polyfill.ts";

export function main(denops: Denops): void {
  denops.dispatcher = {
    "start": (name, args, options) => {
      return friendlyCall(denops, () => {
        return start(
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
  };
}
