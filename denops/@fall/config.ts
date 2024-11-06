import type { Denops } from "jsr:@denops/std@^7.3.0";

import type { Layout } from "./layout.ts";
import type { Theme } from "./theme.ts";
import type { Curator } from "./curator.ts";
import type { Source } from "./source.ts";
import type { Matcher } from "./matcher.ts";
import type { Sorter } from "./sorter.ts";
import type { Renderer } from "./renderer.ts";
import type { Previewer } from "./previewer.ts";
import type { Action } from "./action.ts";

export type Actions<T, A extends string> =
  & Record<string, Action<T>>
  & { [key in A]: Action<T> };

export type ItemPickerParams<T, A extends string> = {
  name: string;
  source: Source<T>;
  matcher: Matcher<NoInfer<T>>;
  actions: Actions<T, NoInfer<A>>;
  defaultAction: A;
  sorter?: Sorter<NoInfer<T>>;
  renderer?: Renderer<NoInfer<T>>;
  previewer?: Previewer<NoInfer<T>>;
  layout?: Layout;
  theme?: Theme;
};

export type ActionPickerParams = {
  matcher: Matcher<Action<unknown>>;
  sorter?: Sorter<Action<unknown>>;
  renderer?: Renderer<Action<unknown>>;
  previewer?: Previewer<Action<unknown>>;
  layout?: Layout;
  theme?: Theme;
};

export type GlobalConfig = {
  layout: Layout;
  theme: Theme;
};

/**
 * Define an item picker from source/matcher.
 */
export type DefineItemPickerFromSource = <T, A extends string>(
  name: string,
  source: Source<T>,
  params: {
    matcher: Matcher<NoInfer<T>>;
    actions: Actions<NoInfer<T>, NoInfer<A>>;
    defaultAction: A;
    sorter?: Sorter<NoInfer<T>>;
    renderer?: Renderer<NoInfer<T>>;
    previewer?: Previewer<NoInfer<T>>;
    layout?: Layout;
    theme?: Theme;
  },
) => void;

/**
 * Define an item picker from curator.
 */
export type DefineItemPickerFromCurator = <T, A extends string>(
  name: string,
  curator: Curator<T>,
  params: {
    actions: Actions<NoInfer<T>, NoInfer<A>>;
    defaultAction: A;
    sorter?: Sorter<NoInfer<T>>;
    renderer?: Renderer<NoInfer<T>>;
    previewer?: Previewer<NoInfer<T>>;
    layout?: Layout;
    theme?: Theme;
  },
) => void;

/**
 * Refine the action picker.
 */
export type RefineActionPicker = (
  params: {
    name: string;
    matcher: Matcher<Action<unknown>>;
    sorter?: Sorter<Action<unknown>>;
    renderer?: Renderer<Action<unknown>>;
    previewer?: Previewer<Action<unknown>>;
    layout?: Layout;
    theme?: Theme;
  },
) => void;

/**
 * Refine the global configuration.
 */
export type RefineGlobalConfig = (
  params: {
    layout?: Layout;
    theme?: Theme;
  },
) => void;

/**
 * The entrypoint of the configuration file.
 */
export type Entrypoint = (params: {
  denops: Denops;
  defineItemPickerFromSource: DefineItemPickerFromSource;
  defineItemPickerFromCurator: DefineItemPickerFromCurator;
  refineActionPicker: RefineActionPicker;
  refineGlobalConfig: RefineGlobalConfig;
}) => void | Promise<void>;
