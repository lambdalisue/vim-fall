import type { GetSource } from "https://deno.land/x/fall_core@v0.9.0/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v6.4.0/function/mod.ts";
import { walk } from "jsr:@std/fs@0.229.0/walk";
import { relative } from "jsr:@std/path@0.225.0/relative";
import { assert, is } from "jsr:@core/unknownutil@3.18.0";

const isOptions = is.StrictOf(is.PartialOf(is.ObjectOf({
  includes: is.ArrayOf(is.String),
  excludes: is.ArrayOf(is.String),
})));

const defaultExcludes: string[] = [
  ".*/.DS_Store",
  ".*/.git/.*",
  ".*/node_modules/.*",
];

export const getSource: GetSource = (denops, options) => {
  assert(options, isOptions);
  const includes = options.includes;
  const excludes = options.excludes ?? defaultExcludes;
  return {
    async stream({ cmdline }) {
      const abspath = await fn.fnamemodify(
        denops,
        await fn.expand(denops, cmdline || "."),
        ":p",
      );
      return new ReadableStream({
        async start(controller) {
          for await (
            const { path } of walk(abspath, {
              includeDirs: false,
              match: includes?.map((v) => new RegExp(v)),
              skip: excludes.map((v) => new RegExp(v)),
            })
          ) {
            controller.enqueue({
              value: relative(abspath, path),
              detail: { path },
            });
          }
          controller.close();
        },
      });
    },
  };
};
