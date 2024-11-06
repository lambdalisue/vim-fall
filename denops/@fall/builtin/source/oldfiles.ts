import type { Denops } from "jsr:@denops/std@^7.3.0";
import * as vars from "jsr:@denops/std@^7.0.0/variable";

import type { Item } from "../../item.ts";
import type { CollectParams, Source } from "../../source.ts";

type Detail = {
  path: string;
};

/**
 * A source to collect oldfiles.
 */
export class OldfilesSource implements Source<Detail> {
  async *collect(
    denops: Denops,
    _params: CollectParams,
    { signal }: { signal?: AbortSignal },
  ): AsyncIterableIterator<Item<Detail>> {
    const oldfiles = await vars.v.get(denops, "oldfiles") as string[];
    signal?.throwIfAborted();
    for (const path of oldfiles) {
      yield {
        value: path,
        detail: {
          path,
        },
      };
    }
  }
}
