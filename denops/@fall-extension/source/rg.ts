import type {
  GetSource,
  SourceItem,
} from "jsr:@lambdalisue/vim-fall@0.6.0/source";
import { input } from "jsr:@lambdalisue/vim-fall@0.6.0/util/input";
import { TextLineStream } from "https://deno.land/std@0.224.0/streams/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v6.4.2/function/mod.ts";
import { assert, is, maybe } from "jsr:@core/unknownutil@3.18.0";

const isOptions = is.StrictOf(is.PartialOf(is.ObjectOf({
  args: is.ArrayOf(is.String),
  highlight: is.String,
  includes: is.ArrayOf(is.String),
  excludes: is.ArrayOf(is.String),
})));

const isMatchResult = is.ObjectOf({
  type: is.LiteralOf("match"),
  data: is.ObjectOf({
    path: is.ObjectOf({
      text: is.String,
    }),
    lines: is.ObjectOf({
      text: is.String,
    }),
    line_number: is.Number,
    submatches: is.ArrayOf(is.ObjectOf({
      match: is.ObjectOf({
        text: is.String,
      }),
      start: is.Number,
      end: is.Number,
    })),
  }),
});

function parse(
  s: string,
  highlight: string,
): SourceItem[] {
  const m = maybe(JSON.parse(s), isMatchResult);
  if (!m) return [];
  const path = m.data.path.text;
  const line = m.data.line_number;
  const content = m.data.lines.text.trimEnd();
  return m.data.submatches.map((m) => {
    const prefix = `${path}:${line}:${m.start}:`;
    const decoration = {
      line,
      column: prefix.length + m.start + 1,
      length: m.end - m.start,
      highlight,
    };
    return {
      value: `${prefix}${content}`,
      detail: {
        path,
        line,
        column: m.start,
        length: m.end - m.start,
        content,
      },
      decorations: [decoration],
    };
  });
}

export const getSource: GetSource = (denops, options) => {
  assert(options, isOptions);
  const args = options.args ?? [];
  const highlight = options.highlight ?? "IncSearch";
  const includes = options.includes?.map((v) => new RegExp(v));
  const excludes = options.excludes?.map((v) => new RegExp(v));
  return {
    async stream({ cmdline }) {
      if (!cmdline) {
        cmdline = await input(denops, {
          title: " rg ",
          prompt: "Pattern: ",
        }) ?? "";
      }
      if (!cmdline) {
        throw new DOMException("Cancelled", "AbortError");
      }

      const cwd = await fn.getcwd(denops);
      const cmd = new Deno.Command("rg", {
        cwd,
        args: [...args, "--json", "--", cmdline],
        stdin: "null",
        stdout: "piped",
        stderr: "null",
      });
      const proc = cmd.spawn();
      proc.unref();
      return proc.stdout
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(new TextLineStream())
        .pipeThrough(
          new TransformStream({
            transform(chunk, controller) {
              parse(chunk, highlight).forEach((item) => {
                if (includes && includes.every((p) => !p.test(item.value))) {
                  return;
                }
                if (excludes && excludes.some((p) => p.test(item.value))) {
                  return;
                }
                controller.enqueue(item);
              });
            },
          }),
        );
    },
  };
};
