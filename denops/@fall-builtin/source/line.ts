import type { Source } from "https://deno.land/x/fall_core@v0.8.0/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v6.3.0/function/mod.ts";
import { assert, is } from "jsr:@core/unknownutil@3.18.0";

const isOptions = is.StrictOf(is.PartialOf(is.ObjectOf({})));

export function getSource(
  options: Record<string, unknown>,
): Source {
  assert(options, isOptions);
  return {
    getStream: async (denops, cmdline: string) => {
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
              detail: { path, line },
            });
            line += 1;
          },
        }),
      );
    },
  };
}
