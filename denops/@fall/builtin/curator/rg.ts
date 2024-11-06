import type { Denops } from "jsr:@denops/std@^7.3.0";
import * as fn from "jsr:@denops/std@^7.3.0/function";
import { TextLineStream } from "jsr:@std/streams@^1.0.0/text-line-stream";

import type { IdItem } from "../../item.ts";
import type { CurateParams, Curator } from "../../curator.ts";

type RgDetail = {
  path: string;
  line: number;
  column: number;
  context: string;
};

const pattern = new RegExp("^(.*?):(\\d+):(\\d+):(.*)$");

/**
 * A curator to collect items from ripgrep.
 */
export class RgCurator implements Curator<RgDetail> {
  #root?: string;

  async *curate(
    denops: Denops,
    { args, query }: CurateParams,
    { signal }: { signal?: AbortSignal },
  ): AsyncIterableIterator<IdItem<RgDetail>> {
    this.#root ??= await getAbsolutePathOf(denops, args[0] ?? ".", signal);
    const cmd = new Deno.Command("rg", {
      args: [
        "--color=never",
        "--no-heading",
        "--no-messages",
        "--with-filename",
        "--line-number",
        "--column",
        query,
        "--",
        this.#root,
      ],
      stdin: "null",
      stdout: "piped",
      stderr: "null",
    });
    await using proc = cmd.spawn();
    const stream = proc.stdout
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new TextLineStream());
    let id = 0;
    for await (const record of stream) {
      signal?.throwIfAborted();
      const result = parse(record);
      if (!result) {
        continue;
      }
      const { path, line, column, context } = result;
      yield {
        id: id++,
        value: `${path}:${line}:${column}:${context}`,
        detail: {
          path,
          line,
          column,
          context,
        },
      };
    }
  }
}

async function getAbsolutePathOf(
  denops: Denops,
  expr: string,
  signal?: AbortSignal,
): Promise<string> {
  const path = await fn.expand(denops, expr) as string;
  signal?.throwIfAborted();
  const abspath = await fn.fnamemodify(denops, path, ":p");
  return abspath;
}

function parse(record: string) {
  const m = record.match(pattern);
  if (!m) return;
  const [, path, line, column, context] = m;
  return {
    path,
    line: Number(line),
    column: Number(column),
    context,
  };
}
