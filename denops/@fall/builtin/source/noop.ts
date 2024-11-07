import type { Denops } from "jsr:@denops/std@^7.3.0";

import type { IdItem } from "../../item.ts";
import type { CollectParams, Source } from "../../source.ts";

/**
 * A source to collect nothing.
 */
export class NoopSource implements Source<undefined> {
  async *collect(
    _denops: Denops,
    _params: CollectParams,
    _options: { signal?: AbortSignal },
  ): AsyncIterableIterator<IdItem<undefined>> {}
}
