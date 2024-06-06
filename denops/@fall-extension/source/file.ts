import type { GetSource } from "jsr:@lambdalisue/vim-fall@0.6.0/source";
import * as fn from "https://deno.land/x/denops_std@v6.4.0/function/mod.ts";
import { join } from "jsr:@std/path@1.0.0-rc.1/join";
import { assert, is } from "jsr:@core/unknownutil@3.18.0";

const isOptions = is.StrictOf(is.PartialOf(is.ObjectOf({
  includes: is.ArrayOf(is.String),
  excludes: is.ArrayOf(is.String),
})));

export const getSource: GetSource = (denops, options) => {
  assert(options, isOptions);
  const includes = options.includes?.map((p) => new RegExp(p));
  const excludes = options.excludes?.map((p) => new RegExp(p));
  return {
    async stream({ cmdline }) {
      const abspath = await fn.fnamemodify(
        denops,
        await fn.expand(denops, cmdline || "."),
        ":p",
      );
      return new ReadableStream({
        async start(controller) {
          for await (const path of walk(abspath)) {
            if (includes && !includes.some((p) => p.test(path))) {
              continue;
            } else if (excludes && excludes.some((p) => p.test(path))) {
              continue;
            }
            controller.enqueue({
              value: path,
              detail: { path },
            });
          }
          controller.close();
        },
      });
    },
  };
};

async function* walk(
  root: string,
): AsyncIterableIterator<string> {
  for await (const entry of Deno.readDir(root)) {
    const path = join(root, entry.name);
    let { isSymlink, isDirectory } = entry;
    if (isSymlink) {
      // Follow Symlink
      try {
        const realPath = await Deno.realPath(path);
        ({ isSymlink, isDirectory } = await Deno.lstat(realPath));
      } catch (err) {
        if (err instanceof Deno.errors.NotFound) {
          // The symlink target is not found
          continue;
        }
        throw err;
      }
    }
    if (isSymlink || isDirectory) {
      yield* walk(path);
    } else {
      yield path;
    }
  }
}
