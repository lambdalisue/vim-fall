import type { Previewer } from "https://deno.land/x/fall_core@v0.8.0/mod.ts";
import type { Denops } from "https://deno.land/x/denops_std@v6.4.0/mod.ts";
import { batch } from "https://deno.land/x/denops_std@v6.4.0/batch/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v6.4.0/function/mod.ts";
import * as buffer from "https://deno.land/x/denops_std@v6.4.0/buffer/mod.ts";
import { basename } from "jsr:@std/path@0.225.0/basename";
import { assert, is, type PredicateType } from "jsr:@core/unknownutil@3.18.0";

const isOptions = is.StrictOf(is.PartialOf(is.ObjectOf({})));

const isPathDetail = is.ObjectOf({
  path: is.String,
  line: is.OptionalOf(is.Number),
  column: is.OptionalOf(is.Number),
});

const isUrlDetail = is.ObjectOf({
  url: is.String,
  line: is.OptionalOf(is.Number),
  column: is.OptionalOf(is.Number),
});

export function getPreviewer(
  options: Record<string, unknown>,
): Previewer {
  assert(options, isOptions);
  return {
    preview: async (denops, item, { bufnr, winid }) => {
      if (isPathDetail(item.detail)) {
        await pathPreview(denops, winid, item.detail);
      } else if (isUrlDetail(item.detail)) {
        const resp = await fetch(item.detail.url);
        const text = await resp.text();
        const content = text.split("\n");
        await contentPreview(
          denops,
          bufnr,
          winid,
          basename(item.detail.url),
          content,
          item.detail,
        );
      } else {
        await contentPreview(
          denops,
          bufnr,
          winid,
          "blank",
          ["No preview is available"],
          {},
        );
      }
    },
  };
}

async function pathPreview(
  denops: Denops,
  winid: number,
  detail: PredicateType<typeof isPathDetail>,
): Promise<void> {
  const { line = 1, column = 1 } = detail;
  const path = await fn.fnameescape(denops, detail.path);
  await batch(denops, async (denops) => {
    await fn.win_execute(
      denops,
      winid,
      `setlocal modifiable`,
    );
    await fn.win_execute(
      denops,
      winid,
      `silent! 0,$delete _`,
    );
    await fn.win_execute(
      denops,
      winid,
      `silent! 0read ${path}`,
    );
    await fn.win_execute(
      denops,
      winid,
      `silent! $delete _`,
    );
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
      `silent! file fall://preview/${basename(path)}`,
    );
    await fn.win_execute(
      denops,
      winid,
      `silent! doautocmd <nomodeline> BufRead`,
    );
    await fn.win_execute(
      denops,
      winid,
      `setlocal nomodifiable`,
    );
    await fn.win_execute(denops, winid, `normal! ${line}G${column}|`);
  });
}

async function contentPreview(
  denops: Denops,
  bufnr: number,
  winid: number,
  name: string,
  content: string[],
  { line = 1, column = 1 }: { line?: number; column?: number },
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
      `silent! file fall://preview/${name}`,
    );
    await fn.win_execute(
      denops,
      winid,
      `silent! doautocmd <nomodeline> BufRead`,
    );
    await fn.win_execute(denops, winid, `normal! ${line}G${column}|`);
  });
}
