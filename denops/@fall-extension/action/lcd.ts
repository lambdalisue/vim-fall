import type { GetAction } from "../../@fall/action.ts";
import { dirname } from "jsr:@std/path@0.225.0/dirname";
import { is } from "jsr:@core/unknownutil@3.18.0";

const description = `
Execute 'lcd' command with the directory of the cursor item.
`.trim();

const isPathDetail = is.ObjectOf({
  path: is.String,
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
      await denops.cmd("execute 'lcd' fnameescape(path)", { path });
    },
  };
};
