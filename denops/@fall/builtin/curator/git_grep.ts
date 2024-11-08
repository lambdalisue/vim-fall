import * as fn from "jsr:@denops/std@^7.3.0/function";
import { TextLineStream } from "jsr:@std/streams@^1.0.0/text-line-stream";

import { type Curator, defineCurator } from "../../curator.ts";

type GitGrepDetail = {
  path: string;
  line: number;
  column: number;
  context: string;
};

const pattern = new RegExp("^(.*?):(\\d+):(\\d+):(.*)$");

export function gitGrep(): Curator<GitGrepDetail> {
  return defineCurator<GitGrepDetail>(
    async function* (denops, { query }, { signal }) {
      const cwd = await fn.getcwd(denops);
      const cmd = new Deno.Command("git", {
        cwd,
        args: [
          "grep",
          "--color=never",
          "--no-heading",
          "--full-name",
          "--line-number",
          "--column",
          query,
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
    },
  );
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
