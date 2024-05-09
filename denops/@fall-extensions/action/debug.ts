import type { Action } from "https://deno.land/x/fall_core@v0.8.0/mod.ts";
import { batch } from "https://deno.land/x/denops_std@v6.3.0/batch/mod.ts";
import { assert, is } from "jsr:@core/unknownutil@3.18.0";

const isOptions = is.StrictOf(is.PartialOf(is.ObjectOf({})));

export function getAction(
  options: Record<string, unknown>,
): Action {
  assert(options, isOptions);
  return {
    invoke: async (denops, { cursorItem, selectedItems }) => {
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
      // Keep picker running
      return true;
    },
  };
}
