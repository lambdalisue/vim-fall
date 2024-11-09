import type { Denops } from "jsr:@denops/std@^7.3.0";

import type { Promish } from "./_typeutil.ts";
import type { IdItem } from "./item.ts";

export type InvokeParams<T> = {
  /**
   * The item under the cursor.
   */
  readonly item?: IdItem<T> | undefined;
  /**
   * The selected items.
   */
  readonly selectedItems?: readonly IdItem<T>[] | undefined;
  /**
   * The filtered items.
   */
  readonly filteredItems: readonly IdItem<T>[];
};

export type Action<T> = {
  /**
   * Invoke the action.
   *
   * @param denops The Denops instance.
   * @param params The parameters for invoking the action.
   * @param options The options.
   * @returns If the picker should not be closed, return `true`.
   */
  invoke(
    denops: Denops,
    params: InvokeParams<T>,
    options: { signal?: AbortSignal },
  ): Promish<void | true>;
};

/**
 * Define an action.
 *
 * @param invoke The function to invoke the action.
 * @returns The action.
 */
export function defineAction<T>(
  invoke: (
    denops: Denops,
    params: InvokeParams<T>,
    options: { signal?: AbortSignal },
  ) => Promish<void | true>,
): Action<T> {
  return {
    invoke,
  };
}
