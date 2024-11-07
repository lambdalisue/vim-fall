import type { Denops } from "jsr:@denops/std@^7.3.0";
import * as fn from "jsr:@denops/std@^7.0.0/function";
import { relative } from "jsr:@std/path@^1.0.0/relative";

import type { IdItem } from "../../item.ts";
import type { Projector, ProjectParams } from "../../projector.ts";

type Detail = {
  path: string;
};

type DetailAfter = {
  abspath: string;
};

export class RelativePathModifier<T extends Detail, U extends T & DetailAfter>
  implements Projector<T, U> {
  async *project(
    denops: Denops,
    { items }: ProjectParams<T>,
    { signal }: { signal?: AbortSignal },
  ): AsyncIterableIterator<IdItem<U>> {
    const cwd = await fn.getcwd(denops);
    signal?.throwIfAborted();
    for await (const item of items) {
      const relpath = relative(cwd, item.detail.path);
      const value = item.value.replace(item.detail.path, relpath);
      yield {
        ...item,
        value,
        detail: {
          ...item.detail,
          path: relpath,
          abspath: item.detail.path,
        },
      } as IdItem<U>;
    }
  }
}
