import type { Denops } from "jsr:@denops/std@^7.3.0";

import type { DisplayItem } from "./item.ts";

export type RenderParams<T> = {
  /**
   * Items to render.
   */
  readonly items: DisplayItem<T>[];
};

export type Renderer<T> = {
  /**
   * Render items.
   *
   * This method modifies the items in place.
   *
   * @param denops The Denops instance.
   * @param params The parameters to render items.
   * @param options The options.
   * @param options.signal The signal to abort.
   */
  render(
    denops: Denops,
    params: RenderParams<T>,
    options: { signal?: AbortSignal },
  ): void | Promise<void>;
};
