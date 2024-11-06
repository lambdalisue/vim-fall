import type { Denops } from "jsr:@denops/std@^7.3.0";

import type { Renderer, RenderParams } from "../../renderer.ts";

/**
 * A renderer to render helptags.
 */
export class HelptagRenderer<T extends { helptag: string; lang?: string }>
  implements Renderer<T> {
  async render(
    _denops: Denops,
    { items }: RenderParams<T>,
    { signal }: { signal?: AbortSignal },
  ) {
    for await (const item of items) {
      signal?.throwIfAborted();
      if (item.detail.lang) {
        item.label = `${item.value}@${item.detail.lang}`;
        item.decorations = [
          {
            column: item.value.length + 1,
            length: item.detail.lang.length + 1,
            highlight: "Comment",
          },
        ];
      }
    }
  }
}
