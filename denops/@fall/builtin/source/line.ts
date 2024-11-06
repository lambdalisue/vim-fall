import type { Denops } from "jsr:@denops/std@^7.3.0";
import * as fn from "jsr:@denops/std@^7.3.0/function";

import type { Item } from "../../item.ts";
import type { CollectParams, Source } from "../../source.ts";

const CHUNK_SIZE = 1000;

type Options = {
  chunkSize?: number;
};

type Detail = {
  bufnr: number;
  bufname: string;
  line: number;
  context: string;
};

/**
 * A source to collect lines.
 */
export class LineSource implements Source<Detail> {
  readonly #chunkSize: number;

  constructor(options: Readonly<Options> = {}) {
    this.#chunkSize = options.chunkSize ?? CHUNK_SIZE;
  }

  async *collect(
    denops: Denops,
    { args }: CollectParams,
    { signal }: { signal?: AbortSignal } = {},
  ): AsyncIterableIterator<Item<Detail>> {
    const expr = args[0] ?? "%";
    await fn.bufload(denops, expr);
    signal?.throwIfAborted();
    const bufinfos = await fn.getbufinfo(denops, expr);
    signal?.throwIfAborted();
    const bufinfo = bufinfos[0];

    let line = 1;
    while (line <= bufinfo.linecount) {
      const content = await fn.getbufline(
        denops,
        expr,
        line,
        line + this.#chunkSize - 1,
      );
      signal?.throwIfAborted();
      let offset = 0;
      for (const value of content) {
        yield {
          value,
          detail: {
            line: line + offset,
            bufnr: bufinfo.bufnr,
            bufname: bufinfo.name,
            context: value,
          },
        };
        offset++;
      }
      line += this.#chunkSize;
    }
  }
}
