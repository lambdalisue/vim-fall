import type { Denops } from "jsr:@denops/std@^7.3.0";
import * as vars from "jsr:@denops/std@^7.0.0/variable";

import type { IdItem } from "../../item.ts";
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
  ): AsyncIterableIterator<IdItem<Detail>> {
    const oldfiles = await vars.v.get(denops, "oldfiles") as string[];
    signal?.throwIfAborted();
    let id = 0;
    for (const path of oldfiles) {
      yield {
        id: id++,
        value: path,
        detail: {
          path,
        },
      };
    }
  }
}
