import * as opt from "jsr:@denops/std@^7.0.0/option";
import { walk } from "jsr:@std/fs@^1.0.0/walk";
import { join } from "jsr:@std/path@^1.0.0/join";

import { defineSource, type Source } from "../../source.ts";

type Helptag = {
  helptag: string;
  helpfile: string;
  lang?: string;
};

export function helptag(): Source<Helptag> {
  return defineSource(async function* (denops, _params, { signal }) {
    const runtimepaths = (await opt.runtimepath.get(denops)).split(",");
    signal?.throwIfAborted();
    const seen = new Set<string>();
    let id = 0;
    for (const runtimepath of runtimepaths) {
      for await (const helptag of discoverHelptags(runtimepath)) {
        signal?.throwIfAborted();
        const key = `${helptag.helptag}:${helptag.lang ?? ""}`;
        if (seen.has(key)) {
          continue;
        }
        yield {
          id: id++,
          value: helptag.helptag,
          detail: helptag,
        };
        seen.add(key);
      }
    }
  });
}

async function* discoverHelptags(
  runtimepath: string,
): AsyncGenerator<Helptag> {
  const match = [/\/tags(?:-\w{2})?$/];
  try {
    for await (
      const { path, name } of walk(join(runtimepath, "doc"), {
        includeDirs: false,
        match,
      })
    ) {
      const lang = name.match(/tags-(\w{2})$/)?.at(1);
      for (const helptag of parseHelptags(await Deno.readTextFile(path))) {
        yield {
          ...helptag,
          lang,
        };
      }
    }
  } catch (err) {
    if (isSilence(err)) return;
    throw err;
  }
}

function* parseHelptags(
  content: string,
): Generator<Helptag> {
  const lines = content.split("\n");
  for (const line of lines) {
    if (line.startsWith("!_TAG_") || line.trim() === "") {
      continue;
    }
    const [helptag, helpfile] = line.split("\t", 3);
    yield { helptag, helpfile };
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
