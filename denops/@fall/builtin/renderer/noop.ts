import type { Denops } from "jsr:@denops/std@^7.3.0";

import type { Renderer, RenderParams } from "../../renderer.ts";

/**
 * A renderer to do nothing.
 */
export class NoopRenderer<T> implements Renderer<T> {
  render(
    _denops: Denops,
    _params: RenderParams<T>,
    _options: { signal?: AbortSignal },
  ) {
    return;
  }
}
