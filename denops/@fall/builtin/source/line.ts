import * as fn from "jsr:@denops/std@^7.3.0/function";

import { defineSource, type Source } from "../../source.ts";

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

export function line(options: Options = {}): Source<Detail> {
  const { chunkSize = CHUNK_SIZE } = options;
  return defineSource<Detail>(async function* (denops, { args }, { signal }) {
    const expr = args[0] ?? "%";
    await fn.bufload(denops, expr);
    signal?.throwIfAborted();
    const bufinfos = await fn.getbufinfo(denops, expr);
    signal?.throwIfAborted();
    const bufinfo = bufinfos[0];

    let line = 1;
    let id = 0;
    while (line <= bufinfo.linecount) {
      const content = await fn.getbufline(
        denops,
        expr,
        line,
        line + chunkSize - 1,
      );
      signal?.throwIfAborted();
      let offset = 0;
      for (const value of content) {
        yield {
          id: id++,
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
      line += chunkSize;
    }
  });
}
