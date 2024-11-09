import type { Denops } from "jsr:@denops/std@^7.3.0";

import type { Coordinator } from "./coordinator.ts";
import type { Theme } from "./theme.ts";
import type { Curator } from "./curator.ts";
import type { Source } from "./source.ts";
import type { Matcher } from "./matcher.ts";
import type { Sorter } from "./sorter.ts";
import type { Renderer } from "./renderer.ts";
import type { Previewer } from "./previewer.ts";
import type { Action } from "./action.ts";
import type { Derivable, DerivableMap } from "./util/derivable.ts";

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
  coordinator?: Coordinator;
  theme?: Theme;
};

export type ActionPickerParams = {
  matcher: Matcher<Action<unknown>>;
  sorter?: Sorter<Action<unknown>>;
  renderer?: Renderer<Action<unknown>>;
  previewer?: Previewer<Action<unknown>>;
  coordinator?: Coordinator;
  theme?: Theme;
};

export type GlobalConfig = {
  coordinator: Coordinator;
  theme: Theme;
};

/**
 * Define an item picker from source/matcher.
 */
export type DefineItemPickerFromSource = <T, A extends string>(
  name: string,
  source: Derivable<Source<T>>,
  params: {
    matcher: Derivable<Matcher<NoInfer<T>>>;
    actions: DerivableMap<Actions<NoInfer<T>, NoInfer<A>>>;
    defaultAction: A;
    sorter?: Derivable<Sorter<NoInfer<T>>>;
    renderer?: Derivable<Renderer<NoInfer<T>>>;
    previewer?: Derivable<Previewer<NoInfer<T>>>;
    coordinator?: Derivable<Coordinator>;
    theme?: Derivable<Theme>;
  },
) => void;

/**
 * Define an item picker from curator.
 */
export type DefineItemPickerFromCurator = <T, A extends string>(
  name: string,
  curator: Derivable<Curator<T>>,
  params: {
    actions: DerivableMap<Actions<NoInfer<T>, NoInfer<A>>>;
    defaultAction: A;
    sorter?: Derivable<Sorter<NoInfer<T>>>;
    renderer?: Derivable<Renderer<NoInfer<T>>>;
    previewer?: Derivable<Previewer<NoInfer<T>>>;
    coordinator?: Derivable<Coordinator>;
    theme?: Derivable<Theme>;
  },
) => void;

/**
 * Refine the action picker.
 */
export type RefineActionPicker = (
  params: {
    matcher?: Derivable<Matcher<Action<unknown>>>;
    sorter?: Derivable<Sorter<Action<unknown>>>;
    renderer?: Derivable<Renderer<Action<unknown>>>;
    previewer?: Derivable<Previewer<Action<unknown>>>;
    coordinator?: Derivable<Coordinator>;
    theme?: Derivable<Theme>;
  },
) => void;

/**
 * Refine the global configuration.
 */
export type RefineGlobalConfig = (
  params: {
    coordinator?: Derivable<Coordinator>;
    theme?: Derivable<Theme>;
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
