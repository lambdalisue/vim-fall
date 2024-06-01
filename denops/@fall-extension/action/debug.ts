import type { GetAction } from "jsr:@lambdalisue/vim-fall@0.6.0/action";

const description = `
Print JSON representation of cursor or selected item(s).
`.trim();

export const getAction: GetAction = (_denops, _options) => {
  return {
    description,

    invoke({ cursorItem, selectedItems }) {
      const items = selectedItems.length > 0
        ? selectedItems
        : cursorItem
        ? [cursorItem]
        : [];
      const content = items
        .map((item) => JSON.stringify(item, null, 2))
        .join("\n");
      // Print AFTER the picker is closed otherwise the message won't be showen.
      setTimeout(() => console.log(`[fall] ${content}`), 50);
    },
  };
};
