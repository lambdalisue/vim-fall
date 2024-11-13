import type { Denops } from "jsr:@denops/std@^7.3.2";
import type { Detail, DetailUnit, IdItem } from "jsr:@vim-fall/std@^0.4.0/item";
import type { Curator } from "jsr:@vim-fall/std@^0.4.0/curator";
import type { Action } from "jsr:@vim-fall/std@^0.4.0/action";
import type { CollectParams, Source } from "jsr:@vim-fall/std@^0.4.0/source";
import type { Matcher, MatchParams } from "jsr:@vim-fall/std@^0.4.0/matcher";
import type {
  DefineItemPickerFromCurator,
  DefineItemPickerFromSource,
  GlobalConfig,
  ItemPickerParams,
} from "jsr:@vim-fall/std@^0.4.0/config";
import {
  derive,
  deriveArray,
  deriveMap,
} from "jsr:@vim-fall/std@^0.4.0/util/derivable";

import { getGlobalConfig } from "./global_config.ts";

type Actions = ItemPickerParams<DetailUnit, string>["actions"];

const itemPickerParamsMap = new Map<
  string,
  ItemPickerParams<Detail, string>
>();

export function listItemPickerNames(): readonly string[] {
  return Array.from(itemPickerParamsMap.keys());
}

export function resetItemPickerParams(): void {
  itemPickerParamsMap.clear();
}

export function getItemPickerParams(
  name: string,
): Readonly<ItemPickerParams<DetailUnit, string> & GlobalConfig> | undefined {
  const params = itemPickerParamsMap.get(name);
  if (params) {
    return { ...getGlobalConfig(), ...params };
  }
  return undefined;
}

export const defineItemPickerFromSource: DefineItemPickerFromSource = (
  name,
  source,
  params,
) => {
  if (itemPickerParamsMap.has(name)) {
    throw new Error(`Item picker "${name}" is already defined.`);
  }
  validatePickerName(name);
  const derivedParams = omitUndefinedAttributes({
    actions: deriveMap(params.actions) as Actions,
    defaultAction: params.defaultAction,
    matchers: deriveArray(params.matchers),
    sorters: params.sorters ? deriveArray(params.sorters) : undefined,
    renderers: params.renderers ? deriveArray(params.renderers) : undefined,
    previewers: params.previewers ? deriveArray(params.previewers) : undefined,
    coordinator: derive(params.coordinator),
    theme: derive(params.theme),
  });
  validateActions(derivedParams.actions);
  itemPickerParamsMap.set(name, {
    ...derivedParams,
    name,
    source: derive(source),
  } as ItemPickerParams<Detail, string>);
};

export const defineItemPickerFromCurator: DefineItemPickerFromCurator = (
  name,
  curator,
  params,
) => {
  validatePickerName(name);
  const source = new CuratorSourceMatcher(derive(curator));
  const derivedParams = omitUndefinedAttributes({
    actions: deriveMap(params.actions) as Actions,
    defaultAction: params.defaultAction,
    sorters: params.sorters ? deriveArray(params.sorters) : undefined,
    renderers: params.renderers ? deriveArray(params.renderers) : undefined,
    previewers: params.previewers ? deriveArray(params.previewers) : undefined,
    coordinator: derive(params.coordinator),
    theme: derive(params.theme),
  });
  validateActions(derivedParams.actions);
  itemPickerParamsMap.set(name, {
    ...derivedParams,
    name,
    source,
    matchers: [source as Matcher<DetailUnit>],
  });
};

class CuratorSourceMatcher<T extends Detail> implements Source<T>, Matcher<T> {
  #curator: Curator<T>;
  #args?: readonly string[];

  // This attribute is referred in Picker to determine if MatchProcessor
  // should be 'incremental'
  readonly incremental = true;

  constructor(curator: Curator<T>) {
    this.#curator = curator;
  }

  async *collect(
    _denops: Denops,
    params: CollectParams,
    _options: { signal?: AbortSignal },
  ) {
    this.#args = params.args;
    yield* [];
  }

  async *match<V extends T>(
    denops: Denops,
    params: MatchParams<V>,
    options: { signal?: AbortSignal },
  ): AsyncIterableIterator<IdItem<V>> {
    if (!this.#args) {
      throw new Error("Collect is not called before match.");
    }
    const curatorParams = {
      ...params,
      args: this.#args,
    };
    yield* this.#curator.curate(
      denops,
      curatorParams,
      options,
    ) as AsyncIterableIterator<IdItem<V>>;
  }
}

function omitUndefinedAttributes<
  M extends Record<PropertyKey, unknown>,
  R extends { [K in keyof M]: M[K] extends undefined ? never : M[K] },
>(
  map: M,
): R {
  return Object.fromEntries(
    Object.entries(map).filter(([, v]) => v !== undefined),
  ) as R;
}

function validatePickerName(name: string): void {
  if (itemPickerParamsMap.has(name)) {
    throw new Error(`Item picker "${name}" is already defined.`);
  }
  if (name.startsWith("@")) {
    throw new Error(`Name "${name}" must not start with "@".`);
  }
}

function validateActions(actions: Record<string, Action>): void {
  Object.entries(actions).forEach(([name, _action]) => {
    if (name.startsWith("@")) {
      throw new Error(`Action name "${name}" must not start with "@".`);
    }
  });
}
