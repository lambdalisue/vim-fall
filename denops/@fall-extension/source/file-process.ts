import type { GetSource } from "../../@fall/source.ts";
import * as fn from "https://deno.land/x/denops_std@v6.4.0/function/mod.ts";
import { fromFileUrl } from "https://deno.land/std@0.217.0/path/from_file_url.ts";
import { TextLineStream } from "jsr:@std/streams@0.224.0/text-line-stream";
import { toJson } from "jsr:@std/streams@0.224.0/to-json";
import { walkSync } from "jsr:@std/fs@0.229.0/walk";
import { relative } from "jsr:@std/path@0.225.0/relative";
import { assert, ensure, is } from "jsr:@core/unknownutil@3.18.0";

const isOptions = is.StrictOf(is.PartialOf(is.ObjectOf({
  includes: is.ArrayOf(is.String),
  excludes: is.ArrayOf(is.String),
})));

export const getSource: GetSource = (denops, options) => {
  assert(options, isOptions);
  const includes = options.includes;
  const excludes = options.excludes;
  return {
    async stream({ cmdline }) {
      const abspath = await fn.fnamemodify(
        denops,
        await fn.expand(denops, cmdline || "."),
        ":p",
      );
      return new ReadableStream({
        async start(controller) {
          const command = new Deno.Command(Deno.execPath(), {
            args: ["run", "-A", fromFileUrl(import.meta.url)],
            stdin: "piped",
            stdout: "piped",
          });
          const proc = command.spawn();
          await Promise.all([
            proc.status,
            ReadableStream
              .from(JSON.stringify({ abspath, includes, excludes }))
              .pipeThrough(new TextEncoderStream())
              .pipeTo(proc.stdin),
            proc.stdout
              .pipeThrough(new TextDecoderStream())
              .pipeThrough(new TextLineStream())
              .pipeTo(
                new WritableStream({
                  write(json) {
                    controller.enqueue(JSON.parse(json));
                  },
                }),
              ),
          ]);
          controller.close();
        },
      });
    },
  };
};

if (import.meta.main) {
  const { abspath, includes, excludes } = ensure(
    await toJson(Deno.stdin.readable),
    is.ObjectOf({
      abspath: is.String,
      includes: is.OptionalOf(is.ArrayOf(is.String)),
      excludes: is.OptionalOf(is.ArrayOf(is.String)),
    }),
  );
  try {
    for (
      const { path } of walkSync(abspath, {
        includeDirs: false,
        match: includes?.map((v) => new RegExp(v)),
        skip: excludes?.map((v) => new RegExp(v)),
      })
    ) {
      console.log(JSON.stringify({
        value: relative(abspath, path),
        detail: { path },
      }));
    }
  } catch {
    // Fail silently
  }
}
