import type { GetAction } from "jsr:@lambdalisue/vim-fall@0.6.0/action";
import { dirname } from "jsr:@std/path@0.225.0/dirname";
import { is } from "jsr:@core/unknownutil@3.18.0";

const description = `
Execute 'cd' command with the directory of the cursor item.
`.trim();

const isPathDetail = is.ObjectOf({
  path: is.String,
  line: is.OptionalOf(is.Number),
  column: is.OptionalOf(is.Number),
});

export const getAction: GetAction = (denops, _options) => {
  return {
    description,

    async invoke({ cursorItem }) {
      if (!cursorItem || !isPathDetail(cursorItem.detail)) {
        return;
      }
      const stat = await Deno.stat(cursorItem.detail.path);
      const path = stat.isDirectory
        ? cursorItem.detail.path
        : dirname(cursorItem.detail.path);
      await denops.cmd("execute 'cd' fnameescape(path)", { path });
    },
  };
};
