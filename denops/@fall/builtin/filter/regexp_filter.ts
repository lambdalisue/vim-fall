import type { Denops } from "jsr:@denops/std@^7.3.0";

import type { IdItem } from "../../item.ts";
import type { Projector, ProjectParams } from "../../projector.ts";

type Options = {
  includes?: RegExp[];
  excludes?: RegExp[];
};

type Detail = {
  path: string;
};

export class RegexpFilter<T extends Detail> implements Projector<T> {
  #includes?: RegExp[];
  #excludes?: RegExp[];

  constructor({ includes, excludes }: Options) {
    this.#includes = includes;
    this.#excludes = excludes;
  }

  async *project(
    _denops: Denops,
    { items }: ProjectParams<T>,
    { signal }: { signal?: AbortSignal },
  ): AsyncIterableIterator<IdItem<T>> {
    signal?.throwIfAborted();
    for await (const item of items) {
      signal?.throwIfAborted();
      if (this.#includes && !this.#includes.some((r) => r.test(item.value))) {
        continue;
      }
      if (this.#excludes && this.#excludes.some((r) => r.test(item.value))) {
        continue;
      }
      yield item;
    }
  }
}
