import type { GetSource } from "jsr:@lambdalisue/vim-fall@0.6.0/source";
import * as fn from "https://deno.land/x/denops_std@v6.3.0/function/mod.ts";
import { assert, is } from "jsr:@core/unknownutil@3.18.0";

const isOptions = is.StrictOf(is.PartialOf(is.ObjectOf({})));

export const getSource: GetSource = (denops, options) => {
  assert(options, isOptions);
  return {
    async stream({ cmdline }) {
      const path = await fn.expand(denops, cmdline || "%") as string;
      const bufnr = await fn.bufadd(denops, path);
      await fn.bufload(denops, bufnr);
      const content = await fn.getbufline(denops, path, 1, "$");
      let line = 1;
      return ReadableStream.from(content).pipeThrough(
        new TransformStream({
          transform(chunk, controller) {
            controller.enqueue({
              value: chunk,
              detail: { bufnr, path, line },
            });
            line += 1;
          },
        }),
      );
    },
  };
};
