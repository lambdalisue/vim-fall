import type { Decoration } from "https://deno.land/x/denops_std@v6.3.0/buffer/decoration.ts";

export type ItemDecoration =
  & Omit<Decoration, "line" | "highlight">
  & Partial<Pick<Decoration, "highlight">>;

export interface Item {
  /**
   * Unique identifier of the item provided by the picker.
   *
   * This identifier distinguishes the item in the picker.
   * Developers must preserve this value as-is.
   */
  id: unknown;

  /**
   * The value of the item.
   */
  value: string;

  /**
   * The display label of the item.
   *
   * This label is used to display the item in the picker.
   * If not specified, `value` is used.
   */
  label?: string;

  /**
   * The detailed information of the item.
   *
   * This information is used in further processing.
   * Developers should verify if the `detail` has the expected structure before using it
   * and ignore the item if it does not.
   */
  detail: Record<string, unknown>;

  /**
   * Decorations to be applied to the line of the item in the picker.
   *
   * These decorations highlight the matched part of the item, or are used for better visualization.
   * Developers should respect existing `decorations` and extend them.
   *
   * Note: If `highlight` is not specified, the picker will use the default highlight group
   * for highlighting the matched part.
   */
  decorations: ItemDecoration[];
}
