export type IdItem<T> = {
  /**
   * The unique identifier of the item.
   */
  readonly id: number;

  /**
   * The value of the item.
   */
  readonly value: string;

  /**
   * The detailed information of the item.
   *
   * This information is used in further processing.
   * Developers should verify if the `detail` has the expected structure before using it
   * and ignore the item if it does not.
   */
  readonly detail: T;

  /**
   * The display label of the item.
   *
   * This label is used to display the item in the picker.
   * If not specified, `value` is used.
   */
  label?: string;

  /**
   * Decorations to be applied to the line of the item in the picker.
   *
   * These decorations highlight the matched part of the item, or are used for better visualization.
   * Developers should respect existing `decorations` and extend them.
   *
   * Note: If `highlight` is not specified, the picker will use the default highlight group
   * for highlighting the matched part.
   */
  decorations?: readonly ItemDecoration[];
};

export type DisplayItem<T> = IdItem<T> & {
  /**
   * The display label of the item.
   *
   * This label is used to display the item in the picker.
   * If not specified, `value` is used.
   */
  label: string;

  /**
   * Decorations to be applied to the line of the item in the picker.
   *
   * These decorations highlight the matched part of the item, or are used for better visualization.
   * Developers should respect existing `decorations` and extend them.
   *
   * Note: If `highlight` is not specified, the picker will use the default highlight group
   * for highlighting the matched part.
   */
  decorations: readonly ItemDecoration[];
};

export type PreviewItem = {
  /**
   * The content to preview.
   */
  readonly content: string[];
  /**
   * The line number to jump to.
   */
  readonly line?: number;
  /**
   * The column number to jump to.
   */
  readonly column?: number;
  /**
   * The filetype used for highlighting.
   */
  readonly filetype?: string;
  /**
   * The filename used in the buffer name.
   */
  readonly filename?: string;
};

export type ItemDecoration = {
  /**
   * Column number (bytes)
   */
  readonly column: number;
  /**
   * Length (bytes)
   */
  readonly length: number;
  /**
   * Highlight name
   */
  readonly highlight?: string;
};
