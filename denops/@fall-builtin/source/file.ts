import type {
  Source,
  SourceOptions,
} from "https://deno.land/x/fall_core@v0.7.0/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v6.4.0/function/mod.ts";
import { walk } from "https://deno.land/std@0.217.0/fs/walk.ts";
import { relative } from "https://deno.land/std@0.217.0/path/relative.ts";
import { ensure, is } from "https://deno.land/x/unknownutil@v3.16.3/mod.ts";
import { deepMerge } from "https://deno.land/std@0.219.0/collections/deep_merge.ts";

const isOptions = is.StrictOf(is.PartialOf(is.ObjectOf({
  excludes: is.ArrayOf(is.String),
})));

export function getSource(
  globalOptions: SourceOptions,
): Source {
  return {
    getStream: async (denops, cmdline, localOptions) => {
      const options = ensure(deepMerge(globalOptions, localOptions), isOptions);
      const exclude = options.excludes ?? [];
      const abspath = await fn.fnamemodify(
        denops,
        await fn.expand(denops, cmdline || "."),
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
