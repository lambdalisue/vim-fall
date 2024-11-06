import type { Denops } from "jsr:@denops/std@^7.3.0";
import * as fn from "jsr:@denops/std@^7.0.0/function";

import type { Item } from "../../item.ts";
import type { CollectParams, Source } from "../../source.ts";

type Mode = "cmd" | "search" | "expr" | "input" | "debug";

type History = {
  line: string;
  mode: Mode;
  index: number;
  histnr: number;
};

type Options = {
  mode?: Mode;
};

type Detail = {
  history: History;
};

/**
 * A source to collect history.
 */
export class HistorySource implements Source<Detail> {
  #mode: Mode;

  constructor(options: Readonly<Options> = {}) {
    this.#mode = options.mode ?? "cmd";
  }

  async *collect(
    denops: Denops,
    _params: CollectParams,
    { signal }: { signal?: AbortSignal },
  ): AsyncIterableIterator<Item<Detail>> {
    const mode = this.#mode;
    const histnr = await fn.histnr(denops, mode);
    signal?.throwIfAborted();
    for (let index = histnr; index > 0; index--) {
      const line = await fn.histget(denops, mode, index);
      if (line) {
        yield {
          value: line,
          detail: {
            history: {
              line,
              mode,
              index,
              histnr,
            },
          },
        };
      }
    }
  }
}
