import type { Denops } from "jsr:@denops/std@^7.3.0";
import type { Curator } from "jsr:@vim-fall/std@^0.1.0/curator";
import type { CollectParams, Source } from "jsr:@vim-fall/std@^0.1.0/source";
import type { Matcher, MatchParams } from "jsr:@vim-fall/std@^0.1.0/matcher";
import type {
  DefineItemPickerFromCurator,
  DefineItemPickerFromSource,
  GlobalConfig,
  ItemPickerParams,
} from "jsr:@vim-fall/std@^0.1.0/config";
import {
  derive,
  deriveArray,
  deriveMap,
} from "jsr:@vim-fall/std@^0.1.0/util/derivable";

import { getGlobalConfig } from "./global_config.ts";

type Actions = ItemPickerParams<unknown, string>["actions"];

const itemPickerParamsMap = new Map<
  string,
  ItemPickerParams<unknown, string>
>();

export function listItemPickerNames(): readonly string[] {
  return Array.from(itemPickerParamsMap.keys());
}

export function getItemPickerParams(
  name: string,
): Readonly<ItemPickerParams<unknown, string> & GlobalConfig> | undefined {
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
  itemPickerParamsMap.set(name, {
    ...derivedParams,
    name,
    source: derive(source),
  });
};

export const defineItemPickerFromCurator: DefineItemPickerFromCurator = (
  name,
  curator,
  params,
) => {
  if (itemPickerParamsMap.has(name)) {
    throw new Error(`Item picker "${name}" is already defined.`);
  }
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
  itemPickerParamsMap.set(name, {
    ...derivedParams,
    name,
    source,
    matchers: [source],
  });
};

class CuratorSourceMatcher<T> implements Source<T>, Matcher<T> {
  #curator: Curator<T>;
  #args?: readonly string[];

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

  async *match(
    denops: Denops,
    params: MatchParams<T>,
    options: { signal?: AbortSignal },
  ) {
    if (!this.#args) {
      throw new Error("Collect is not called before match.");
    }
    const curatorParams = {
      ...params,
      args: this.#args,
    };
    yield* this.#curator.curate(denops, curatorParams, options);
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
