import type { Matcher } from "../../matcher.ts";
import type { Renderer } from "../../renderer.ts";
import type { Theme } from "../../theme.ts";
import type { Sorter } from "../../sorter.ts";
import type { Previewer } from "../../previewer.ts";
import type { Coordinator } from "../../coordinator.ts";
import type { Actions, GlobalConfig, ItemPickerParams } from "../../config.ts";
import { list } from "../source/list.ts";
import { type Action, defineAction } from "../../action.ts";
import {
  type Derivable,
  type DerivableArray,
  type DerivableMap,
  derive,
  deriveArray,
  deriveMap,
} from "../../util/derivable.ts";
import { fzf } from "../matcher/fzf.ts";
import { substring } from "../matcher/substring.ts";
import { regexp } from "../matcher/regexp.ts";

type Options<T, A extends string> = {
  actions?: DerivableMap<Actions<T, A>>;
  defaultAction?: A;
  sorters?: DerivableArray<Sorter<T>[]> | null;
  renderers?: DerivableArray<Renderer<T>[]> | null;
  previewers?: DerivableArray<Previewer<T>[]> | null;
  coordinator?: Derivable<Coordinator> | null;
  theme?: Derivable<Theme> | null;
};

export function submatch<T, A extends string>(
  matchers: DerivableArray<[Matcher<T>, ...Matcher<T>[]]>,
  options: Options<T, A> = {},
): Action<T> {
  return defineAction<T>(
    async (denops, { selectedItems, filteredItems, context }, { signal }) => {
      const params: ItemPickerParams<T, string> & GlobalConfig = {
        ...context.pickerParams,
        source: list(selectedItems ?? filteredItems),
        matchers: deriveArray(matchers),
      };
      if (options.actions) {
        params.actions = deriveMap(params.actions);
      }
      if (options.defaultAction) {
        params.defaultAction = options.defaultAction;
      }
      if (options.sorters !== undefined) {
        params.sorters = options.sorters
          ? deriveArray(options.sorters)
          : undefined;
      }
      if (options.renderers !== undefined) {
        params.renderers = options.renderers
          ? deriveArray(options.renderers)
          : undefined;
      }
      if (options.previewers !== undefined) {
        params.previewers = options.previewers
          ? deriveArray(options.previewers)
          : undefined;
      }
      if (options.coordinator !== undefined) {
        params.coordinator = derive(options.coordinator) ??
          context.globalConfig.coordinator;
      }
      if (options.theme !== undefined) {
        params.theme = derive(options.theme) ?? context.globalConfig.theme;
      }
      const result = await denops.dispatch(
        "fall",
        "picker:start",
        [],
        context.screen,
        params,
        { signal },
      );
      if (result) {
        return true;
      }
    },
  );
}

export const defaultSubmatchActions: {
  "sub:fzf": Action<unknown>;
  "sub:substring": Action<unknown>;
  "sub:regexp": Action<unknown>;
} = {
  "sub:fzf": submatch([fzf]),
  "sub:substring": submatch([substring]),
  "sub:regexp": submatch([regexp]),
};
