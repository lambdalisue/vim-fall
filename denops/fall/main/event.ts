import type { Entrypoint } from "jsr:@denops/std@^7.3.0";
import { as, ensure, is, type Predicate } from "jsr:@core/unknownutil@^4.3.0";

import { dispatch, type Event } from "../event.ts";

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

// NOTE:
// Only event that is dispatched from Vim requires predicate function.
// So this is NOT a full list of event types.
const isEventComplement = is.UnionOf([
  // Vim
  is.ObjectOf({
    type: is.LiteralOf("vim-resized"),
    width: is.Number,
    height: is.Number,
  }),
  // Cursor
  is.ObjectOf({
    type: is.LiteralOf("move-cursor"),
    amount: is.Number,
    scroll: as.Optional(is.Boolean),
  }),
  is.ObjectOf({
    type: is.LiteralOf("move-cursor-at"),
    cursor: is.UnionOf([is.Number, is.LiteralOf("$")]),
  }),
  // Select
  is.ObjectOf({
    type: is.LiteralOf("select-item"),
    cursor: as.Optional(is.UnionOf([is.Number, is.LiteralOf("$")])),
    method: as.Optional(is.LiteralOneOf(["on", "off", "toggle"] as const)),
  }),
  is.ObjectOf({
    type: is.LiteralOf("select-all-items"),
    method: as.Optional(is.LiteralOneOf(["on", "off", "toggle"] as const)),
  }),
  // Action
  is.ObjectOf({
    type: is.LiteralOf("action-invoke"),
    name: is.String,
  }),
  // List
  is.ObjectOf({
    type: is.LiteralOf("list-execute"),
    command: is.String,
  }),
  // Preview
  is.ObjectOf({
    type: is.LiteralOf("preview-execute"),
    command: is.String,
  }),
]) satisfies Predicate<Event>;
