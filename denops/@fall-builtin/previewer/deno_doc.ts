import type { Previewer } from "https://deno.land/x/fall_core@v0.3.0/mod.ts";
import type { Denops } from "https://deno.land/x/denops_std@v6.3.0/mod.ts";
import { batch } from "https://deno.land/x/denops_std@v6.3.0/batch/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v6.3.0/function/mod.ts";
import * as buffer from "https://deno.land/x/denops_std@v6.3.0/buffer/mod.ts";
import { basename } from "https://deno.land/std@0.218.2/path/basename.ts";
import { toFileUrl } from "https://deno.land/std@0.218.2/path/to_file_url.ts";
import {
  assert,
  is,
  type PredicateType,
} from "https://deno.land/x/unknownutil@v3.16.3/mod.ts";

const isOptions = is.StrictOf(is.PartialOf(is.ObjectOf({
  importMap: is.String,
  reload: is.Boolean,
  noNpm: is.Boolean,
  noRemote: is.Boolean,
  private: is.Boolean,
})));

type Options = PredicateType<typeof isOptions>;

const isPathDetail = is.ObjectOf({
  path: is.String,
});

const isUrlDetail = is.ObjectOf({
  url: is.String,
});

export function getPreviewer(
  options: Record<string, unknown>,
): Previewer {
  assert(options, isOptions);
  return {
    preview: async (denops, item, { bufnr, winid }) => {
      let name = "deno_doc";
      let content: string[] = ["No preview available."];
      if (isPathDetail(item.detail)) {
        name = basename(item.detail.path);
        content = await denoDoc(
          new URL(toFileUrl(item.detail.path)),
          options,
        );
      }
      if (isUrlDetail(item.detail)) {
        name = basename(item.detail.url);
        content = await denoDoc(new URL(item.detail.url), options);
      }
      await preview(
        denops,
        bufnr,
        winid,
        name,
        content,
      );
    },
  };
}

async function preview(
  denops: Denops,
  bufnr: number,
  winid: number,
  name: string,
  content: string[],
): Promise<void> {
  await buffer.replace(denops, bufnr, content);
  await batch(denops, async (denops) => {
    await fn.win_execute(
      denops,
      winid,
      `silent! 0file`,
    );
    await fn.win_execute(
      denops,
      winid,
      `silent! syntax clear`,
    );
    await fn.win_execute(
      denops,
      winid,
      `silent! file fall://preview/${name}.md`,
    );
    await fn.win_execute(
      denops,
      winid,
      `silent! doautocmd <nomodeline> BufRead`,
    );
  });
}

async function denoDoc(
  url: URL,
  options: Options,
): Promise<string[]> {
  if (denoDocCache.has(url)) {
    return denoDocCache.get(url)!;
  }
  const args = ["doc", url.toString()];
  if (options.importMap) {
    args.push("--import-map", options.importMap);
  }
  if (options.reload) {
    args.push("--reload");
  }
  if (options.noNpm) {
    args.push("--no-npm");
  }
  if (options.noRemote) {
    args.push("--no-remote");
  }
  if (options.private) {
    args.push("--private");
  }
  const cmd = new Deno.Command(Deno.execPath(), {
    args,
    stdout: "piped",
    stderr: "piped",
  });
  const { success, stdout, stderr } = await cmd.output();
  if (!success) {
    const err = new TextDecoder().decode(stderr);
    return [`Failed to get deno doc result: ${err}`];
  }
  const content = new TextDecoder().decode(stdout).split("\n");
  denoDocCache.set(url, content);
  return content;
}
const denoDocCache: Map<URL, string[]> = new Map();
