import type { GetSource } from "jsr:@lambdalisue/vim-fall@0.6.0/source";
import * as vars from "jsr:@denops/std@7.0.0/variable";
import { ensure, is } from "jsr:@core/unknownutil@3.18.0";

export const getSource: GetSource = (denops, _options) => {
  return {
    async stream() {
      const oldfiles = ensure(
        await vars.v.get(denops, "oldfiles"),
        is.ArrayOf(is.String),
      );
      const items = oldfiles
        .map((path) => ({
          value: path,
          detail: {
            path,
          },
        }));
      return ReadableStream.from(items);
    },
  };
};
