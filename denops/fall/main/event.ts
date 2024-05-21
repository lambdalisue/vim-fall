import type { Denops } from "https://deno.land/x/denops_std@v6.4.0/mod.ts";
import { ensure } from "jsr:@core/unknownutil@3.18.0";

import { dispatch, isFallEventName } from "../util/event.ts";

export function main(denops: Denops): void {
  denops.dispatcher = {
    ...denops.dispatcher,
    "event:dispatch": (name, data) => {
      dispatch(ensure(name, isFallEventName), data);
    },
  };
}
