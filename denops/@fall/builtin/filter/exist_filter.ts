import type { Denops } from "jsr:@denops/std@^7.3.0";
import { exists } from "jsr:@std/fs@^1.0.0/exists";

import type { IdItem } from "../../item.ts";
import type { Projector, ProjectParams } from "../../projector.ts";

type Detail = {
  path: string;
};

export class ExistFilter<T extends Detail> implements Projector<T> {
  async *project(
    _denops: Denops,
    { items }: ProjectParams<T>,
    { signal }: { signal?: AbortSignal },
  ): AsyncIterableIterator<IdItem<T>> {
    for await (const item of items) {
      if (await exists(item.detail.path)) {
        yield item;
      }
      signal?.throwIfAborted();
    }
  }
}
