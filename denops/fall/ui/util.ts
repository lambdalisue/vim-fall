import type { Denops } from "https://deno.land/x/denops_std@v6.3.0/mod.ts";
import { emit } from "https://deno.land/x/denops_std@v6.3.0/autocmd/mod.ts";

import type { Filter, PresentationItem, Processor } from "../types.ts";

export async function applyFiltersAndSorterAndPresenters(
  denops: Denops,
  items: PresentationItem[],
  query: string,
  filters: Filter[],
  sorter: Processor,
  presenters: Processor[],
  { signal }: { signal?: AbortSignal },
): Promise<PresentationItem[]> {
  for (const filter of filters) {
    items = await filter(denops, items, query, { signal });
  }
  items = await sorter(denops, items, { signal });
  for (const presenter of presenters) {
    items = await presenter(denops, items, { signal });
  }
  return items;
}

export function isDefined<T>(v: T | undefined): v is T {
  return v !== undefined;
}

export async function emitPickerEnter(
  denops: Denops,
  name: string,
): Promise<void> {
  try {
    await denops.call("fall#internal#mapping#store");
    await emit(denops, "User", `FallPickerEnter:${name}`, { nomodeline: true });
  } catch (err) {
    console.warn("[fall] Failed to emit FallPickerEnter:", err);
  }
}

export async function emitPickerLeave(
  denops: Denops,
  name: string,
): Promise<void> {
  try {
    await emit(denops, "User", `FallPickerLeave:${name}`, { nomodeline: true });
  } catch (err) {
    console.warn("[fall] Failed to emit FallPickerLeave:", err);
  } finally {
    await denops.call("fall#internal#mapping#restore");
  }
}
