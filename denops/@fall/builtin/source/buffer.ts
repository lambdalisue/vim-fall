import type { Denops } from "jsr:@denops/std@^7.3.0";
import * as fn from "jsr:@denops/std@^7.0.0/function";

import type { Item } from "../../item.ts";
import type { CollectParams, Source } from "../../source.ts";

type Filter = "buflisted" | "bufloaded" | "bufmodified";

type Options = {
  /**
   * The mode to filter the buffer.
   */
  filter?: Filter;
};

type Detail = {
  bufnr: number;
  bufname: string;
  bufinfo: fn.BufInfo;
};

/**
 * A source to collect buffers.
 */
export class BufferSource implements Source<Detail> {
  readonly #filter?: Filter;

  constructor(options: Readonly<Options> = {}) {
    this.#filter = options.filter;
  }

  async *collect(
    denops: Denops,
    _params: CollectParams,
    { signal }: { signal?: AbortSignal },
  ): AsyncIterableIterator<Item<Detail>> {
    const bufinfo = await fn.getbufinfo(denops);
    signal?.throwIfAborted();
    const items = bufinfo
      .filter((v) => v.name !== "")
      .filter((v) => {
        if (this.#filter === "buflisted") {
          return v.listed;
        } else if (this.#filter === "bufloaded") {
          return v.loaded;
        } else if (this.#filter === "bufmodified") {
          return v.changed;
        }
        return true;
      })
      .map((v) => ({
        value: v.name,
        detail: {
          bufnr: v.bufnr,
          bufname: v.name,
          bufinfo: v,
        },
      }));
    yield* items;
  }
}
