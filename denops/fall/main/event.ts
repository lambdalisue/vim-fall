import type { Denops } from "jsr:@denops/std@7.0.0";
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
