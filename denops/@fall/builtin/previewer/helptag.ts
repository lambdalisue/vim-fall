import type { Denops } from "jsr:@denops/std@^7.3.0";
import * as opt from "jsr:@denops/std@^7.0.0/option";
import { join } from "jsr:@std/path@^1.0.0/join";

import type { PreviewItem } from "../../item.ts";
import type { Previewer, PreviewParams } from "../../previewer.ts";

const helpfileCache = new Map<string, string>();

type Detail = {
  helptag: string;
  helpfile: string;
  lang?: string;
};

/**
 * A previewer to preview helptag.
 */
export class HelptagPreviewer<T extends Detail> implements Previewer<T> {
  async preview(
    denops: Denops,
    { item }: PreviewParams<T>,
    { signal }: { signal?: AbortSignal },
  ): Promise<PreviewItem> {
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
  }
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
