import * as fn from "jsr:@denops/std@^7.3.0/function";
import { enumerate } from "jsr:@core/iterutil@^0.9.0/async/enumerate";
import { join } from "jsr:@std/path@^1.0.0/join";

import { defineSource, type Source } from "../../source.ts";

type Options = {
  includes?: RegExp[];
  excludes?: RegExp[];
};

type Detail = {
  path: string;
  stat: Deno.FileInfo;
};

export function file(options: Readonly<Options> = {}): Source<Detail> {
  const { includes, excludes } = options;
  return defineSource(async function* (denops, { args }, { signal }) {
    const path = await fn.expand(denops, args[0] ?? ".") as string;
    signal?.throwIfAborted();
    const abspath = await fn.fnamemodify(denops, path, ":p");
    signal?.throwIfAborted();
    for await (
      const [id, detail] of enumerate(
        collect(abspath, includes, excludes, signal),
      )
    ) {
      yield {
        id,
        value: detail.path,
        detail,
      };
    }
  });
}

async function* collect(
  root: string,
  includes: RegExp[] | undefined,
  excludes: RegExp[] | undefined,
  signal?: AbortSignal,
): AsyncIterableIterator<Detail> {
  for await (const entry of Deno.readDir(root)) {
    const path = join(root, entry.name);
    if (includes && !includes.some((p) => p.test(path))) {
      continue;
    } else if (excludes && excludes.some((p) => p.test(path))) {
      continue;
    }

    let fileInfo: Deno.FileInfo;
    if (entry.isSymlink) {
      // Follow Symlink to walk-through
      try {
        const realPath = await Deno.realPath(path);
        signal?.throwIfAborted();
        fileInfo = await Deno.stat(realPath);
        signal?.throwIfAborted();
      } catch (err) {
        if (isSilence(err)) continue;
        throw err;
      }
    } else {
      try {
        fileInfo = await Deno.stat(path);
        signal?.throwIfAborted();
      } catch (err) {
        if (isSilence(err)) continue;
        throw err;
      }
    }
    if (fileInfo.isDirectory) {
      yield* collect(path, includes, excludes, signal);
    } else {
      yield {
        path,
        stat: fileInfo,
      };
    }
  }
}

function isSilence(err: unknown): boolean {
  if (err instanceof Deno.errors.NotFound) {
    return true;
  }
  if (err instanceof Deno.errors.PermissionDenied) {
    return true;
  }
  if (err instanceof Deno.errors.FilesystemLoop) {
    return true;
  }
  if (err instanceof Error) {
    if (err.message.startsWith("File name too long (os error 63)")) {
      // on macOS, long file name will throw above error
      return true;
    }
  }
  return false;
}
