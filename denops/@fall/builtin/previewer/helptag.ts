import * as opt from "jsr:@denops/std@^7.0.0/option";
import { join } from "jsr:@std/path@^1.0.0/join";

import { definePreviewer, type Previewer } from "../../previewer.ts";

const helpfileCache = new Map<string, string>();

type Detail = {
  helptag: string;
  helpfile: string;
  lang?: string;
};

export function helptag<T extends Detail>(): Previewer<T> {
  return definePreviewer(async (denops, { item }, { signal }) => {
    const runtimepaths = (await opt.runtimepath.get(denops)).split(",");
    signal?.throwIfAborted();
    const text = await readHelpfile(
      runtimepaths,
      item.detail.helpfile,
      signal,
    );
    signal?.throwIfAborted();
    const content = text.split(/\r?\n/g);
    const index = content.findIndex((line) =>
      line.includes(`*${item.detail.helptag}*`)
    );
    return {
      content,
      line: index === -1 ? undefined : index + 1,
    };
  });
}

async function readHelpfile(
  runtimepaths: string[],
  helpfile: string,
  signal?: AbortSignal,
): Promise<string> {
  if (helpfileCache.has(helpfile)) {
    return await Deno.readTextFile(helpfileCache.get(helpfile)!);
  }
  for (const runtimepath of runtimepaths) {
    signal?.throwIfAborted();
    try {
      const path = join(runtimepath, "doc", helpfile);
      const text = await Deno.readTextFile(path);
      signal?.throwIfAborted();

      helpfileCache.set(helpfile, path);
      return text;
    } catch (err) {
      if (isSilence(err)) continue;
      throw err;
    }
  }
  return "";
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
