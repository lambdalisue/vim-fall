import type { GetPreviewer } from "jsr:@lambdalisue/vim-fall@0.6.0/previewer";
import * as opt from "jsr:@denops/std@7.0.0/option";
import { join } from "jsr:@std/path@0.225.1/join";
import { is } from "jsr:@core/unknownutil@3.18.0";

const isHelptagDetail = is.ObjectOf({
  helptag: is.String,
  helpfile: is.String,
  lang: is.OptionalOf(is.String),
});

export const getPreviewer: GetPreviewer = async (denops, _options) => {
  const runtimepaths = (await opt.runtimepath.get(denops)).split(",");
  return {
    async preview({ item }, { signal }) {
      if (!isHelptagDetail(item.detail)) return;
      const text = await readHelpfile(
        runtimepaths,
        item.detail.helpfile,
        signal,
      );
      const content = text.split(/\r?\n/g);
      const index = content.findIndex((line) =>
        line.includes(`*${item.detail.helptag}*`)
      );
      signal?.throwIfAborted();
      return {
        content,
        line: index === -1 ? undefined : index + 1,
      };
    },
  };
};

const helpfileCache = new Map<string, string>();

async function readHelpfile(
  runtimepaths: string[],
  helpfile: string,
  signal?: AbortSignal,
): Promise<string> {
  if (helpfileCache.has(helpfile)) {
    return await Deno.readTextFile(helpfileCache.get(helpfile)!);
  }
  for (const runtimepath of runtimepaths) {
    try {
      const path = join(runtimepath, "doc", helpfile);
      const text = await Deno.readTextFile(path);
      signal?.throwIfAborted();

      helpfileCache.set(helpfile, path);
      return text;
    } catch (err) {
      if (err instanceof Deno.errors.NotFound) {
        continue;
      }
      throw err;
    }
  }
  return "";
}
