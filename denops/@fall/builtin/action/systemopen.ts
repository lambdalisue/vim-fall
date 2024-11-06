import type { Denops } from "jsr:@denops/std@^7.3.0";
import { systemopen } from "jsr:@lambdalisue/systemopen@^1.0.0";

import type { Action, InvokeParams } from "../../action.ts";

type Detail = {
  path: string;
};

export class SystemopenAction<T extends Detail> implements Action<T> {
  async invoke(
    _denops: Denops,
    { item, selectedItems }: InvokeParams<T>,
    { signal }: { signal?: AbortSignal },
  ): Promise<void> {
    const items = selectedItems ?? [item];
    for (const item of items.filter((v) => !!v)) {
      try {
        await systemopen(item.detail.path);
        signal?.throwIfAborted();
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        const m = err instanceof Error ? err.message : String(err);
        console.warn(`[fall] Failed to open ${item.detail.path}: ${m}`);
      }
    }
  }
}

export const systemopenAction: {
  systemopen: SystemopenAction<Detail>;
} = {
  systemopen: new SystemopenAction(),
} as const;
