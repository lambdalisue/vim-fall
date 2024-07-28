import type { GetSource } from "jsr:@lambdalisue/vim-fall@0.6.0/source";
import * as fn from "jsr:@denops/std@7.0.0/function";
import { assert, is } from "jsr:@core/unknownutil@3.18.0";

const isOptions = is.StrictOf(is.PartialOf(is.ObjectOf({
  mode: is.LiteralOneOf(["cmd", "search", "expr", "input", "debug"] as const),
})));

export const getSource: GetSource = (denops, options) => {
  assert(options, isOptions);
  const mode = options.mode ?? "cmd";
  return {
    async stream() {
      const histnr = await fn.histnr(denops, mode);
      return new ReadableStream({
        async start(controller) {
          for (let index = histnr; index > 0; index--) {
            const line = await fn.histget(denops, mode, index);
            if (line) {
              controller.enqueue({
                value: line,
                detail: {
                  history: {
                    line,
                    mode,
                    index,
                    histnr,
                  },
                },
              });
            }
          }
          controller.close();
        },
      });
    },
  };
};
