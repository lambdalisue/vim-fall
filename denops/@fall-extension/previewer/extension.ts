import type { GetPreviewer } from "jsr:@lambdalisue/vim-fall@^0.6.0/previewer";
import { stringify } from "jsr:@std/yaml@^1.0.0/stringify";
import { basename } from "jsr:@std/path@^1.0.0/basename";
import { as, is } from "jsr:@core/unknownutil@^4.0.0";

const isExtensionDetail = is.ObjectOf({
  extension: is.ObjectOf({
    type: is.String,
    name: is.String,
    script: is.String,
    config: as.Optional(is.Record),
  }),
});

export const getPreviewer: GetPreviewer = () => {
  return {
    async preview({ item }, { signal }) {
      if (!isExtensionDetail(item.detail)) {
        return;
      }
      const { type, name, script, config } = item.detail.extension;
      const text = splitText(await Deno.readTextFile(script));
      signal?.throwIfAborted();
      const yaml = splitText(stringify({
        [type]: {
          [name]: config ?? {},
        },
      }));
      const content = [
        `/`.repeat(80),
        `//`,
        `// # Applied configuration`,
        `//`,
        ...yaml.map((line) => `// ${line}`),
        `//`,
        `/`.repeat(80),
        ...text,
      ];
      return {
        filename: basename(script),
        content,
      };
    },
  };
};

function splitText(text: string): string[] {
  const lines = text.split(/\r?\n/g);
  return lines.at(-1) === "" ? lines.slice(0, -1) : lines;
}
