import type { Matcher } from "../../matcher.ts";
import type { Renderer } from "../../renderer.ts";
import type { Theme } from "../../theme.ts";
import type { Sorter } from "../../sorter.ts";
import type { Previewer } from "../../previewer.ts";
import type { Coordinator, Size } from "../../coordinator.ts";
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

type Context<T, A extends string> = {
  /**
   * The screen size.
   */
  readonly screen: Size;
  /**
   * The global configuration.
   */
  readonly globalConfig: GlobalConfig;
  /**
   * The picker parameters.
   */
  readonly pickerParams: ItemPickerParams<T, A> & GlobalConfig;
};

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
    async (denops, { selectedItems, filteredItems, ...params }, { signal }) => {
      const context = getContext(params);
      const pickerParams: ItemPickerParams<T, string> & GlobalConfig = {
        ...context.pickerParams,
        source: list(selectedItems ?? filteredItems),
        matchers: deriveArray(matchers),
      };
      if (options.actions) {
        pickerParams.actions = deriveMap(pickerParams.actions);
      }
      if (options.defaultAction) {
        pickerParams.defaultAction = options.defaultAction;
      }
      if (options.sorters !== undefined) {
        pickerParams.sorters = options.sorters
          ? deriveArray(options.sorters)
          : undefined;
      }
      if (options.renderers !== undefined) {
        pickerParams.renderers = options.renderers
          ? deriveArray(options.renderers)
          : undefined;
      }
      if (options.previewers !== undefined) {
        pickerParams.previewers = options.previewers
          ? deriveArray(options.previewers)
          : undefined;
      }
      if (options.coordinator !== undefined) {
        pickerParams.coordinator = derive(options.coordinator) ??
          context.globalConfig.coordinator;
      }
      if (options.theme !== undefined) {
        pickerParams.theme = derive(options.theme) ??
          context.globalConfig.theme;
      }
      const result = await denops.dispatch(
        "fall",
        "picker:start",
        [],
        context.screen,
        pickerParams,
        { signal },
      );
      if (result) {
        return true;
      }
    },
  );
}

function getContext<T, A extends string>(params: unknown): Context<T, A> {
  if (params && typeof params === "object" && "_submatchContext" in params) {
    return params._submatchContext as Context<T, A>;
  }
  throw new Error(
    "[fall] Invoke params doesn't have required hidden context for submatch",
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
