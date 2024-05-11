import type {
  GetSource,
  SourceItem,
} from "https://deno.land/x/fall_core@v0.11.0/mod.ts";
import { TextLineStream } from "https://deno.land/std@0.224.0/streams/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v6.4.2/function/mod.ts";
import { assert, is, maybe } from "jsr:@core/unknownutil@3.18.0";

import { input } from "../../@fall-util/input.ts";

const isOptions = is.StrictOf(is.PartialOf(is.ObjectOf({
  args: is.ArrayOf(is.String),
  highlight: is.String,
  itemPerColumn: is.Boolean,
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
  itemPerColumn: boolean,
): SourceItem[] {
  const m = maybe(JSON.parse(s), isMatchResult);
  if (!m) return [];
  const path = m.data.path.text;
  const line = m.data.line_number;
  const context = m.data.lines.text.trimEnd();
  if (itemPerColumn) {
    // Return all submatches as items
    return m.data.submatches.map((m) => {
      const prefix = `${path}:${line}:${m.start}:`;
      const decoration = {
        line,
        column: prefix.length + m.start + 1,
        length: m.end - m.start,
        highlight,
      };
      return {
        value: `${prefix}${context}`,
        detail: {
          path,
          line,
          column: m.start,
          context,
        },
        decorations: [decoration],
      };
    });
  } else {
    // Accumulate submatches into a single item
    const prefix = `${path}:${line}:`;
    const decorations = m.data.submatches.map((m) => ({
      line,
      column: prefix.length + m.start + 1,
      length: m.end - m.start,
      highlight,
    }));
    return [{
      value: `${prefix}${context}`,
      detail: {
        path,
        line,
        context,
      },
      decorations,
    }];
  }
}

export const getSource: GetSource = (denops, options) => {
  assert(options, isOptions);
  const args = options.args ?? [];
  const highlight = options.highlight ?? "IncSearch";
  const itemPerColumn = options.itemPerColumn ?? false;
  return {
    async stream({ cmdline }) {
      if (!cmdline) {
        cmdline = await input(denops, {
          title: " rg ",
          prompt: "Pattern: ",
        }) ?? "";
      }
      if (!cmdline) return; // Cancel this source

      const cwd = await fn.getcwd(denops);
      const cmd = new Deno.Command("rg", {
        cwd,
        args: [...args, "--json", "--", cmdline],
        stdin: "null",
        stdout: "piped",
        stderr: "null",
      });
      const proc = cmd.spawn();
      return proc.stdout
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(new TextLineStream())
        .pipeThrough(
          new TransformStream({
            transform(chunk, controller) {
              parse(chunk, highlight, itemPerColumn).forEach((item) =>
                controller.enqueue(item)
              );
            },
          }),
        );
    },
  };
};
