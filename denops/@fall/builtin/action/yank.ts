import type { Denops } from "jsr:@denops/std@^7.3.0";
import type { Action, InvokeParams } from "../../action.ts";

export class YankAction<T> implements Action<T> {
  async invoke(
    denops: Denops,
    { item, selectedItems }: InvokeParams<T>,
    { signal }: { signal?: AbortSignal },
  ): Promise<void> {
    const items = selectedItems ?? [item];
    const value = items.filter((v) => !!v).map((item) => item.value).join("\n");
    signal?.throwIfAborted();
    await denops.cmd("call setreg(v:register, value)", { value });
  }
}

export const yankAction: { yank: YankAction<unknown> } = {
  "yank": new YankAction(),
} as const;
