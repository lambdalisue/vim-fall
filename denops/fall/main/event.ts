import type { Entrypoint } from "jsr:@denops/std@^7.3.2";
import { ensure } from "jsr:@core/unknownutil@^4.3.0";

import { dispatch } from "../event.ts";
import { isEventComplement } from "../util/predicate.ts";

export const main: Entrypoint = (denops) => {
  denops.dispatcher = {
    ...denops.dispatcher,
    "event:dispatch": (event) => {
      return eventDispatch(event);
    },
  };
  return Promise.resolve();
};

function eventDispatch(event: unknown): void {
  dispatch(ensure(event, isEventComplement));
}
