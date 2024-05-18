import type { Denops } from "https://deno.land/x/denops_std@v6.3.0/mod.ts";

import type { Promish } from "./_common.ts";
import type { Item } from "./item.ts";

export type RendererItem = Pick<
  Item,
  "value" | "label" | "detail" | "decorations"
>;

export type RendererParams = Readonly<{
  /**
   * The items to be displayed.
   */
  items: readonly RendererItem[];

  /**
   * The selector window display width.
   */
  width: number;
}>;

/**
 * Renderer is responsible for rendering the items in the selector window of the picker.
 *
 * The renderer is only applied to the visible items on the selector for performance reasons.
 */
export type Renderer = {
  /**
   * Description of the extension.
   */
  readonly description?: string;

  /**
   * Render the items for the picker.
   *
   * This method is called when the picker displays the items on the selector.
   * Note that only visible items are passed to the method.
   *
   * @param params The renderer parameters.
   * @param options.signal The signal to abort the rendering.
   */
  render: (
    params: RendererParams,
    options: { signal?: AbortSignal },
  ) => Promish<readonly RendererItem[]>;
};

/**
 * Get the renderer instance.
 *
 * This function is called when the picker is started.
 *
 * @param denops The Denops instance.
 * @param options The options of the extension.
 */
export type GetRenderer = (
  denops: Denops,
  options: Readonly<Record<string, unknown>>,
) => Promish<Renderer>;
