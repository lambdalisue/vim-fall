import type { Denops } from "jsr:@denops/core@6.1.0";

import type { Promish } from "./_common.ts";
import type { Item } from "./item.ts";

export type ActionItem = Pick<Item, "value" | "detail">;

export type ActionParams = {
  /**
   * The item under the cursor.
   */
  readonly cursorItem?: ActionItem;

  /**
   * The items that are selected.
   */
  readonly selectedItems: readonly ActionItem[];

  /**
   * The items that are available (not filtered).
   */
  readonly projectedItems: readonly ActionItem[];
};

/**
 * Action is responsible for processing specified items within the picker.
 *
 * The action is applied to cursor item, selected items, or available items.
 */
export type Action = {
  /**
   * Description of the extension.
   */
  readonly description?: string;

  /**
   * Invoke the action on specified items.
   *
   * This method is called when the user triggers the action.
   *
   * It should return `true` if the picker needs to continue running.
   *
   * @param params The action parameters.
   * @param options.signal The signal to abort the action.
   * @returns `true` if the picker needs to continue running.
   */
  readonly invoke: (
    params: ActionParams,
    options: { signal?: AbortSignal },
  ) => Promish<void | boolean>;
};

/**
 * Get the action instance.
 *
 * This function is called when the picker is started.
 *
 * @param denops The Denops instance.
 * @param options The options of the extension.
 */
export type GetAction = (
  denops: Denops,
  options: Readonly<Record<string, unknown>>,
) => Promish<Action>;
