import * as fn from "jsr:@denops/std@^7.0.0/function";

import { defineProjector, type Projector } from "../../projector.ts";

type Detail = {
  path: string;
};

export function cwd<T extends Detail>(): Projector<T> {
  return defineProjector<T>(async function* (denops, { items }, { signal }) {
    const cwd = await fn.getcwd(denops);
    signal?.throwIfAborted();
    for await (const item of items) {
      signal?.throwIfAborted();
      if (item.detail.path.startsWith(cwd)) {
        yield item;
      }
    }
  });
}
