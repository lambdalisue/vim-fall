import type { GetPreviewer } from "jsr:@lambdalisue/vim-fall@0.6.0/previewer";
import { stringify } from "jsr:@std/yaml@0.224.1/stringify";
import { basename } from "jsr:@std/path@1.0.0-rc.1/basename";
import { is } from "jsr:@core/unknownutil@3.18.0";

const isExtensionDetail = is.ObjectOf({
  extension: is.ObjectOf({
    type: is.String,
    name: is.String,
    script: is.String,
    config: is.OptionalOf(is.Record),
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
        `// # Applied configuration`,
        ...yaml.map((line) => `// ${line}`),
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
