import type { Denops } from "https://deno.land/x/denops_std@v6.3.0/mod.ts";

import type { Promish } from "./_common.ts";
import type { Item } from "./item.ts";

export type PreviewerItem = Pick<Item, "value" | "detail">;

export type PreviewerParams = {
  /**
   * The item going to be previewd.
   */
  readonly item: PreviewerItem;
  readonly width: number;
  readonly height: number;
};

export type PreviewContent = {
  readonly content: string[];
  readonly line?: number;
  readonly column?: number;
  readonly filename?: string;
};

/**
 * Previewer is responsible for previewing items within the picker.
 *
 * The previewer is applied to a cursor item.
 * The previewer must rewrite the buffer content of the given `bufnr` or `winid` because
 * Vim's popup window does not support opening original buffers.
 */
export type Previewer = {
  /**
   * Description of the extension.
   */
  readonly description?: string;

  /**
   * Return preview content of the item.
   *
   * This method is called when the picker attempts to preview the item.
   *
   * @param params The previewer parameters.
   * @param options.signal The signal to abort the preview.
   */
  readonly preview: (
    params: PreviewerParams,
    options: { signal?: AbortSignal },
  ) => Promish<PreviewContent | void>;
};

/**
 * Get the previewer instance.
 *
 * This function is called when the picker is started.
 *
 * @param denops The Denops instance.
 * @param options The options of the extension.
 */
export type GetPreviewer = (
  denops: Denops,
  options: Readonly<Record<string, unknown>>,
) => Promish<Previewer>;
