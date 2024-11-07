import type { Denops } from "jsr:@denops/std@^7.3.0";
import * as fn from "jsr:@denops/std@^7.0.0/function";

import type { IdItem } from "../../item.ts";
import type { Projector, ProjectParams } from "../../projector.ts";

type Detail = {
  path: string;
};

export class CwdFilter<T extends Detail> implements Projector<T> {
  async *project(
    denops: Denops,
    { items }: ProjectParams<T>,
    { signal }: { signal?: AbortSignal },
  ): AsyncIterableIterator<IdItem<T>> {
    const cwd = await fn.getcwd(denops);
    signal?.throwIfAborted();
    for await (const item of items) {
      signal?.throwIfAborted();
      if (item.detail.path.startsWith(cwd)) {
        yield item;
      }
    }
  }
}
