import type { Denops } from "https://deno.land/x/denops_std@v6.3.0/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v6.3.0/function/mod.ts";
import { assert, is } from "https://deno.land/x/unknownutil@v3.16.3/mod.ts";

import type { Source } from "../../fall/types.ts";

const isOptions = is.StrictOf(is.PartialOf(is.ObjectOf({})));

export default function factory(
  _denops: Denops,
  options: Record<string, unknown>,
): Source {
  assert(options, isOptions);
  return async (denops, ...args: string[]) => {
    const path = await fn.expand(denops, args.at(0) || "%") as string;
    try {
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
    } catch (e) {
      console.warn(`[fall] Failed to collect lines from ${path}: ${e}`);
      return new ReadableStream();
    }
  };
}
