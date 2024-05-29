import type { Denops } from "https://deno.land/x/denops_std@v6.4.0/mod.ts";
import type { GetAction } from "../../@fall/action.ts";

const description = `
Yank the value of the cursor or selected item(s).
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
      const value = items.map((item) => item.value).join("\n");
      await yank(denops, value);
    },
  };
};

async function yank(denops: Denops, value: string): Promise<void> {
  await denops.cmd("call setreg(v:register, value)", { value });
}
