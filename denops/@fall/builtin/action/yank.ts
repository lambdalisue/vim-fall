import { type Action, defineAction } from "../../action.ts";

export function yank<T>(): Action<T> {
  return defineAction(async (denops, { item, selectedItems }, { signal }) => {
    const items = selectedItems ?? [item];
    const value = items.filter((v) => !!v).map((item) => item.value).join("\n");
    signal?.throwIfAborted();
    await denops.cmd("call setreg(v:register, value)", { value });
  });
}

export const defaultYankActions: {
  yank: Action<unknown>;
} = {
  yank: yank(),
};
