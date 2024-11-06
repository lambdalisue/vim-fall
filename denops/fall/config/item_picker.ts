import type { Denops } from "jsr:@denops/std@^7.3.0";

import type { Curator } from "../../@fall/curator.ts";
import type { CollectParams, Source } from "../../@fall/source.ts";
import type { Matcher, MatchParams } from "../../@fall/matcher.ts";
import type {
  DefineItemPickerFromCurator,
  DefineItemPickerFromSource,
  GlobalConfig,
  ItemPickerParams,
} from "../../@fall/config.ts";
import { getGlobalConfig } from "./global_config.ts";

const itemPickerParamsMap = new Map<
  string,
  ItemPickerParams<unknown, string>
>();

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
  itemPickerParamsMap.set(name, {
    ...params,
    name,
    source,
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
  const source = new CuratorSourceMatcher(curator);
  itemPickerParamsMap.set(name, {
    ...params,
    name,
    source,
    matcher: source,
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
