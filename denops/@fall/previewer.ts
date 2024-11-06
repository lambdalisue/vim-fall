import type { Denops } from "jsr:@denops/std@^7.3.0";

import type { IdItem, PreviewItem } from "./item.ts";

export type PreviewParams<T> = {
  /**
   * The item to preview.
   */
  readonly item: IdItem<T>;
};

export type Previewer<T> = {
  /**
   * Preview an item.
   *
   * @param denops The Denops instance.
   * @param params The parameters to preview an item.
   * @param options The options for previewing.
   */
  preview(
    denops: Denops,
    params: PreviewParams<T>,
    options: { signal?: AbortSignal },
  ): void | PreviewItem | Promise<void | PreviewItem>;
};
