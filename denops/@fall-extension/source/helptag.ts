import type { GetSource } from "jsr:@lambdalisue/vim-fall@^0.6.0/source";
import * as opt from "jsr:@denops/std@^7.0.0/option";
import { walk } from "jsr:@std/fs@^1.0.0/walk";
import { join } from "jsr:@std/path@^1.0.0/join";

type Helptag = {
  helptag: string;
  helpfile: string;
  lang?: string;
};

export const getSource: GetSource = async (denops, _options) => {
  const runtimepaths = (await opt.runtimepath.get(denops)).split(",");
  return {
    stream() {
      return new ReadableStream({
        async start(controller) {
          for (const runtimepath of runtimepaths) {
            for await (const helptag of discoverHelptags(runtimepath)) {
              controller.enqueue({
                value: helptag.helptag,
                detail: helptag,
              });
            }
          }
          controller.close();
        },
      });
    },
  };
};

async function* discoverHelptags(
  runtimepath: string,
): AsyncGenerator<Helptag> {
  const match = [/\/tags(?:-\w{2})?$/];
  try {
    for await (
      const { path, name } of walk(join(runtimepath, "doc"), {
        includeDirs: false,
        match,
      })
    ) {
      const lang = name.match(/tags-(\w{2})$/)?.at(1);
      for (const helptag of parseHelptags(await Deno.readTextFile(path))) {
        yield {
          ...helptag,
          lang,
        };
      }
    }
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      return;
    }
    throw err;
  }
}

function* parseHelptags(
  content: string,
): Generator<Helptag> {
  const lines = content.split("\n");
  for (const line of lines) {
    if (line.startsWith("!_TAG_") || line.trim() === "") {
      continue;
    }
    const [helptag, helpfile] = line.split("\t", 3);
    yield { helptag, helpfile };
  }
}
