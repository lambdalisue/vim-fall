import type { GetAction } from "https://deno.land/x/fall_core@v0.11.0/mod.ts";
import { batch } from "https://deno.land/x/denops_std@v6.3.0/batch/mod.ts";
import { assert, is } from "jsr:@core/unknownutil@3.18.0";

const description = `
Echo the string representation of the item.

Note that users explicitly need to show messages
with ':messages' command after the picker is closed.

TODO: Better description.
`.trim();

const isOptions = is.StrictOf(is.PartialOf(is.ObjectOf({})));

export const getAction: GetAction = (denops, options) => {
  assert(options, isOptions);
  return {
    description,

    async trigger({ cursorItem, selectedItems }, { signal }) {
      if (signal?.aborted) return;

      const items = selectedItems.length > 0
        ? selectedItems
        : cursorItem
        ? [cursorItem]
        : [];
      const content = items.map((item) => JSON.stringify(item));
      await batch(denops, async (denops) => {
        for (const line of content) {
          if (signal?.aborted) return;
          await denops.cmd(`echomsg ${line}`);
        }
      });
      // Keep picker running
      return true;
    },
  };
};
