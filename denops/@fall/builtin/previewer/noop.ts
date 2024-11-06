import type { Denops } from "jsr:@denops/std@^7.3.0";

import type { Previewer, PreviewParams } from "../../previewer.ts";

/**
 * A previewer to do nothing.
 */
export class NoopPreviewer<T> implements Previewer<T> {
  preview(
    _denops: Denops,
    _params: PreviewParams<T>,
    _options: { signal?: AbortSignal },
  ): undefined {
    return;
  }
}
