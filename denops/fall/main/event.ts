import type { Entrypoint } from "jsr:@denops/std@^7.3.2";
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
  // Switch
  is.ObjectOf({
    type: is.LiteralOf("switch-matcher"),
    amount: is.Number,
    cycle: as.Optional(is.Boolean),
  }),
  is.ObjectOf({
    type: is.LiteralOf("switch-matcher-at"),
    index: is.UnionOf([is.Number, is.LiteralOf("$")]),
  }),
  is.ObjectOf({
    type: is.LiteralOf("switch-sorter"),
    amount: is.Number,
    cycle: as.Optional(is.Boolean),
  }),
  is.ObjectOf({
    type: is.LiteralOf("switch-sorter-at"),
    index: is.UnionOf([is.Number, is.LiteralOf("$")]),
  }),
  is.ObjectOf({
    type: is.LiteralOf("switch-renderer"),
    amount: is.Number,
    cycle: as.Optional(is.Boolean),
  }),
  is.ObjectOf({
    type: is.LiteralOf("switch-renderer-at"),
    index: is.UnionOf([is.Number, is.LiteralOf("$")]),
  }),
  is.ObjectOf({
    type: is.LiteralOf("switch-previewer"),
    amount: is.Number,
    cycle: as.Optional(is.Boolean),
  }),
  is.ObjectOf({
    type: is.LiteralOf("switch-previewer-at"),
    index: is.UnionOf([is.Number, is.LiteralOf("$")]),
  }),
  // Action
  is.ObjectOf({
    type: is.LiteralOf("action-invoke"),
    name: is.String,
  }),
  // List
  is.ObjectOf({
    type: is.LiteralOf("list-component-execute"),
    command: is.String,
  }),
  // Preview
  is.ObjectOf({
    type: is.LiteralOf("preview-component-execute"),
    command: is.String,
  }),
]) satisfies Predicate<Event>;
