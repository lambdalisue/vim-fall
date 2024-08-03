import type { GetAction } from "jsr:@lambdalisue/vim-fall@^0.6.0/action";
import { systemopen } from "jsr:@lambdalisue/systemopen@^1.0.0";
import { is } from "jsr:@core/unknownutil@^4.0.0";

const isPathDetail = is.ObjectOf({
  path: is.String,
});

export const getAction: GetAction = () => {
  return {
    description:
      "Open the cursor item or selected items with system default application",

    async invoke({ cursorItem, selectedItems }, { signal }) {
      const items = selectedItems.length > 0
        ? selectedItems
        : cursorItem
        ? [cursorItem]
        : [];
      for (const item of items) {
        if (!isPathDetail(item.detail)) {
          continue;
        }
        try {
          await systemopen(item.detail.path);
          signal?.throwIfAborted();
        } catch (err) {
          const m = err.message ?? err;
          console.warn(`[fall] Failed to open ${item.detail.path}: ${m}`);
        }
      }
      return false;
    },
  };
};
