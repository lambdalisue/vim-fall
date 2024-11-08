import type { Denops } from "jsr:@denops/std@^7.3.0";
import * as fn from "jsr:@denops/std@^7.3.0/function";
import { TextLineStream } from "jsr:@std/streams@^1.0.0/text-line-stream";

import { type Curator, defineCurator } from "../../curator.ts";

type GrepDetail = {
  path: string;
  line: number;
  context: string;
};

const pattern = new RegExp("^(.*?):(\\d+):(.*)$");

export function grep(): Curator<GrepDetail> {
  let root: string;
  return defineCurator<GrepDetail>(
    async function* (denops, { args, query }, { signal }) {
      root ??= await getAbsolutePathOf(denops, args[0] ?? ".", signal);
      const cmd = new Deno.Command("grep", {
        args: [
          "--color=never",
          "--no-messages",
          "--recursive",
          "--line-number",
          query,
          "--",
          root,
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
        const { path, line, context } = result;
        yield {
          id: id++,
          value: `${path}:${line}:${context}`,
          detail: {
            path: path,
            line,
            context,
          },
        };
      }
    },
  );
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
  const [, path, line, context] = m;
  return {
    path,
    line: Number(line),
    context,
  };
}
