import type { Denops } from "jsr:@denops/std@7.0.0";
import type { GetAction } from "jsr:@lambdalisue/vim-fall@0.6.0/action";

export const getAction: GetAction = (denops, _options) => {
  return {
    description: "Yank the value of the cursor or selected item(s)",

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
