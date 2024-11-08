import { defineRenderer, type Renderer } from "../../renderer.ts";

export function helptag<
  T extends { helptag: string; lang?: string },
>(): Renderer<T> {
  return defineRenderer<T>(async (_denops, { items }, { signal }) => {
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
  });
}
