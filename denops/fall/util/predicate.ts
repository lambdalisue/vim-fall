import { as, is, type Predicate } from "jsr:@core/unknownutil@^4.3.0";
import type {
  Action,
  Coordinator,
  Curator,
  Detail,
  GlobalConfig,
  ItemPickerParams,
  Matcher,
  Previewer,
  Renderer,
  Size,
  Sorter,
  Source,
  Theme,
} from "jsr:@vim-fall/std@^0.4.0";
import type { Event } from "../event.ts";

export const isStringArray = is.ArrayOf(is.String);

export const isAbortSignal = is.InstanceOf(AbortSignal) as Predicate<
  AbortSignal
>;

export const isScreen = is.ObjectOf({
  width: is.Number,
  height: is.Number,
}) satisfies Predicate<Size>;

export const isTheme = is.ObjectOf({
  border: is.UniformTupleOf(8, is.String),
  divider: is.UniformTupleOf(6, is.String),
}) satisfies Predicate<Theme>;

export const isCoordinator = is.ObjectOf({
  // deno-lint-ignore no-explicit-any
  style: is.Function as Predicate<any>,
  // deno-lint-ignore no-explicit-any
  layout: is.Function as Predicate<any>,
}) satisfies Predicate<Coordinator>;

export const isCurator = is.ObjectOf({
  // deno-lint-ignore no-explicit-any
  curate: is.Function as Predicate<any>,
}) satisfies Predicate<Curator<Detail>>;

export const isSource = is.ObjectOf({
  // deno-lint-ignore no-explicit-any
  collect: is.Function as Predicate<any>,
}) satisfies Predicate<Source<Detail>>;

export const isMatcher = is.ObjectOf({
  // deno-lint-ignore no-explicit-any
  match: is.Function as Predicate<any>,
}) satisfies Predicate<Matcher<Detail>>;

export const isSorter = is.ObjectOf({
  // deno-lint-ignore no-explicit-any
  sort: is.Function as Predicate<any>,
}) satisfies Predicate<Sorter<Detail>>;

export const isRenderer = is.ObjectOf({
  // deno-lint-ignore no-explicit-any
  render: is.Function as Predicate<any>,
}) satisfies Predicate<Renderer<Detail>>;

export const isPreviewer = is.ObjectOf({
  // deno-lint-ignore no-explicit-any
  preview: is.Function as Predicate<any>,
}) satisfies Predicate<Previewer<Detail>>;

export const isAction = is.ObjectOf({
  // deno-lint-ignore no-explicit-any
  invoke: is.Function as Predicate<any>,
}) satisfies Predicate<Action<Detail>>;

export const isGlobalConfig = is.ObjectOf({
  coordinator: isCoordinator,
  theme: isTheme,
}) satisfies Predicate<GlobalConfig>;

export const isItemPickerParams = is.ObjectOf({
  name: is.String,
  source: isSource,
  actions: is.RecordOf(isAction, is.String),
  defaultAction: is.String,
  matchers: is.ArrayOf(isMatcher) as Predicate<
    [Matcher<Detail>, ...Matcher<Detail>[]]
  >,
  sorters: as.Optional(is.ArrayOf(isSorter)),
  renderers: as.Optional(is.ArrayOf(isRenderer)),
  previewers: as.Optional(is.ArrayOf(isPreviewer)),
  coordinator: as.Optional(isCoordinator),
  theme: as.Optional(isTheme),
}) satisfies Predicate<ItemPickerParams<Detail, string>>;

export const isParams = is.IntersectionOf([
  isGlobalConfig,
  isItemPickerParams,
]);

export const isOptions = is.ObjectOf({
  signal: as.Optional(isAbortSignal),
});

export function isIncrementalMatcher<T extends Detail>(m: Matcher<T>): boolean {
  return (m as { incremental?: boolean }).incremental ?? false;
}

const isSelectMethod = is.LiteralOneOf(["on", "off", "toggle"] as const);

// NOTE:
// Only event that is dispatched from Vim requires predicate function.
// So this is NOT a full list of event types.
export const isEventComplement = is.UnionOf([
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
    method: as.Optional(isSelectMethod),
  }),
  is.ObjectOf({
    type: is.LiteralOf("select-all-items"),
    method: as.Optional(isSelectMethod),
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
  // Help
  is.ObjectOf({
    type: is.LiteralOf("help-component-toggle"),
  }),
  is.ObjectOf({
    type: is.LiteralOf("help-component-page"),
    amount: is.Number,
  }),
]) satisfies Predicate<Event>;
