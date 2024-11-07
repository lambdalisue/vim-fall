import type { Denops } from "jsr:@denops/std@^7.3.0";
import * as fn from "jsr:@denops/std@^7.3.0/function";
import { join } from "jsr:@std/path@^1.0.0/join";

import type { IdItem } from "../../item.ts";
import type { CollectParams, Source } from "../../source.ts";

type Options = {
  includes?: RegExp[];
  excludes?: RegExp[];
};

type Detail = {
  path: string;
  stat: Deno.FileInfo;
};

/**
 * A source to collect files recursively.
 */
export class FileSource implements Source<Detail> {
  readonly #includes?: RegExp[];
  readonly #excludes?: RegExp[];

  constructor(options: Readonly<Options> = {}) {
    this.#includes = options.includes;
    this.#excludes = options.excludes;
  }

  async *collect(
    denops: Denops,
    { args }: CollectParams,
    { signal }: { signal?: AbortSignal },
  ): AsyncIterableIterator<IdItem<Detail>> {
    const path = await fn.expand(denops, args[0] ?? ".") as string;
    signal?.throwIfAborted();
    const abspath = await fn.fnamemodify(denops, path, ":p");
    signal?.throwIfAborted();
    yield* collect(
      abspath,
      this.#includes,
      this.#excludes,
      signal,
    );
  }
}

async function* collect(
  root: string,
  includes: RegExp[] | undefined,
  excludes: RegExp[] | undefined,
  signal?: AbortSignal,
  offset = 0,
): AsyncIterableIterator<IdItem<Detail>> {
  let id = offset;
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
      yield* collect(path, includes, excludes, signal, id);
    } else {
      yield {
        id: id++,
        value: path,
        detail: {
          path,
          stat: fileInfo,
        },
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
