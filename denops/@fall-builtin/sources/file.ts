import type { Source } from "https://deno.land/x/fall_core@v0.3.0/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v6.3.0/function/mod.ts";
import { walk } from "https://deno.land/std@0.217.0/fs/walk.ts";
import { relative } from "https://deno.land/std@0.217.0/path/relative.ts";
import { assert, is } from "https://deno.land/x/unknownutil@v3.16.3/mod.ts";

const isOptions = is.StrictOf(is.PartialOf(is.ObjectOf({
  excludes: is.ArrayOf(is.String),
})));

export function getSource(
  options: Record<string, unknown>,
): Source {
  assert(options, isOptions);
  const exclude = options.excludes ?? [];
  return {
    getStream: async (denops, ...args) => {
      const abspath = await fn.fnamemodify(
        denops,
        await fn.expand(denops, args.at(0) || "."),
        ":p",
      );
      return new ReadableStream({
        async start(controller) {
          for await (const { path, isFile } of walk(abspath)) {
            if (isFile && exclude.every((v) => !path.includes(v))) {
              controller.enqueue({
                value: relative(abspath, path),
                detail: { path },
              });
            }
          }
          controller.close();
        },
      });
    },
  };
}
