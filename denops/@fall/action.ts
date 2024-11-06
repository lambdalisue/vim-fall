import type { Denops } from "jsr:@denops/std@^7.3.0";

import type { IdItem } from "./item.ts";
import type { Size } from "./layout.ts";
import type { GlobalConfig, ItemPickerParams } from "./config.ts";

export type Context<T, A extends string> = {
  readonly screen: Size;
  readonly globalConfig: GlobalConfig;
  readonly pickerParams: ItemPickerParams<T, A> & GlobalConfig;
};

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
  /**
   * The picker context.
   */
  readonly context: Context<T, string>;
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
  ): void | true | Promise<void | true>;
};
