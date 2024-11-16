import type { Denops, Entrypoint } from "jsr:@denops/std@^7.3.2";
import { as, assert, is, type Predicate } from "jsr:@core/unknownutil@^4.3.0";
import type {
  Coordinator,
  Detail,
  InvokeParams,
  Matcher,
  Previewer,
  Renderer,
  Sorter,
  Theme,
} from "jsr:@vim-fall/core@^0.2.1";

import type { ItemPickerParams } from "../config.ts";
import {
  isAction,
  isCoordinator,
  isItemPickerParams,
  isMatcher,
  isOptions,
  isPreviewer,
  isRenderer,
  isSorter,
  isTheme,
} from "../util/predicate.ts";
import { list as buildListSource } from "../extension/source/list.ts";

export type SubmatchContext = InvokeParams<Detail> & {
  readonly _submatch: {
    readonly itemPickerParams: ItemPickerParams<Detail, string>;
  };
};

type SubmatchParams = {
  readonly matchers: readonly [Matcher<Detail>, ...Matcher<Detail>[]];
  readonly actions?: ItemPickerParams<Detail, string>["actions"];
  readonly defaultAction?: string;
  readonly sorters?: readonly Sorter<Detail>[] | null;
  readonly renderers?: readonly Renderer<Detail>[] | null;
  readonly previewers?: readonly Previewer<Detail>[] | null;
  readonly coordinator?: Coordinator | null;
  readonly theme?: Theme | null;
};

export const main: Entrypoint = (denops) => {
  denops.dispatcher = {
    ...denops.dispatcher,
    "submatch": async (context, params, options) => {
      assert(context, isSubmatchContext);
      assert(params, isSubmatchParams);
      assert(options, isOptions);
      return await submatchStart(denops, context, params, options);
    },
  };
};

async function submatchStart(
  denops: Denops,
  context: SubmatchContext,
  params: SubmatchParams,
  options: { signal?: AbortSignal } = {},
): Promise<void | true> {
  const itemPickerParams: ItemPickerParams = {
    ...context._submatch.itemPickerParams,
    source: buildListSource(context.selectedItems ?? context.filteredItems),
    matchers: params.matchers,
  };
  if (params.actions) {
    itemPickerParams.actions = params.actions;
  }
  if (params.defaultAction) {
    itemPickerParams.defaultAction = params.defaultAction;
  }
  if (params.sorters) {
    itemPickerParams.sorters = params.sorters;
  }
  if (params.renderers) {
    itemPickerParams.renderers = params.renderers;
  }
  if (params.previewers) {
    itemPickerParams.previewers = params.previewers;
  }
  if (params.coordinator) {
    itemPickerParams.coordinator = params.coordinator;
  }
  if (params.theme) {
    itemPickerParams.theme = params.theme;
  }
  const result = await denops.dispatch(
    denops.name,
    "picker",
    [],
    itemPickerParams,
    options,
  );
  if (result === true) {
    return true;
  }
}

const isSubmatchContext = is.ObjectOf({
  item: as.Optional(is.Any),
  selectedItems: as.Optional(is.ArrayOf(is.Any)),
  filteredItems: is.ArrayOf(is.Any),
  _submatch: is.ObjectOf({
    itemPickerParams: isItemPickerParams,
  }),
}) satisfies Predicate<SubmatchContext>;

const isSubmatchParams = is.ObjectOf({
  matchers: is.ArrayOf(isMatcher) as Predicate<
    [Matcher<Detail>, ...Matcher<Detail>[]]
  >,
  actions: as.Optional(is.RecordOf(isAction, is.String)),
  defaultAction: as.Optional(is.String),
  sorters: as.Optional(is.ArrayOf(isSorter)),
  renderers: as.Optional(is.ArrayOf(isRenderer)),
  previewers: as.Optional(is.ArrayOf(isPreviewer)),
  coordinator: as.Optional(isCoordinator),
  theme: as.Optional(isTheme),
}) satisfies Predicate<SubmatchParams>;
