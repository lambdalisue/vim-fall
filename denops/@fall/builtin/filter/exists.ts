import { exists as exists_ } from "jsr:@std/fs@^1.0.0/exists";

import { defineProjector, type Projector } from "../../projector.ts";

type Detail = {
  path: string;
};

export function exists(): Projector<Detail> {
  return defineProjector(async function* (_denops, { items }, { signal }) {
    for await (const item of items) {
      if (await exists_(item.detail.path)) {
        yield item;
      }
      signal?.throwIfAborted();
    }
  });
}
