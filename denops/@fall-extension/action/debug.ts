import type { GetAction } from "../../@fall/action.ts";
import { batch } from "https://deno.land/x/denops_std@v6.3.0/batch/mod.ts";

const description = `
Echo the string representation of the item.

Note that users explicitly need to show messages
with ':messages' command after the picker is closed.

TODO: Better description.
`.trim();

export const getAction: GetAction = (denops, _options) => {
  return {
    description,

    async invoke({ cursorItem, selectedItems }) {
      const items = selectedItems.length > 0
        ? selectedItems
        : cursorItem
        ? [cursorItem]
        : [];
      const content = items.map((item) => JSON.stringify(item));
      await batch(denops, async (denops) => {
        for (const line of content) {
          await denops.cmd(`echomsg ${line}`);
        }
      });
    },
  };
};
