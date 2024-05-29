import type { GetPreviewer } from "../../@fall/previewer.ts";
import * as opt from "https://deno.land/x/denops_std@v6.3.0/option/mod.ts";
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
    async preview({ item }) {
      if (!isHelptagDetail(item.detail)) return;
      const text = await readHelpfile(runtimepaths, item.detail.helpfile);
      const content = text.split(/\r?\n/g);
      const index = content.findIndex((line) =>
        line.includes(`*${item.detail.helptag}*`)
      );
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
): Promise<string> {
  if (helpfileCache.has(helpfile)) {
    return await Deno.readTextFile(helpfileCache.get(helpfile)!);
  }
  for (const runtimepath of runtimepaths) {
    try {
      const path = join(runtimepath, "doc", helpfile);
      const text = await Deno.readTextFile(path);
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
