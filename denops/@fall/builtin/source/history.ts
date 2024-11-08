import * as fn from "jsr:@denops/std@^7.0.0/function";

import { defineSource, type Source } from "../../source.ts";

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

export function history(options: Options = {}): Source<Detail> {
  const { mode = "cmd" } = options;
  return defineSource<Detail>(async function* (denops, _params, { signal }) {
    const histnr = await fn.histnr(denops, mode);
    signal?.throwIfAborted();
    let id = 0;
    for (let index = histnr; index > 0; index--) {
      const line = await fn.histget(denops, mode, index);
      if (line) {
        yield {
          id: id++,
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
  });
}
