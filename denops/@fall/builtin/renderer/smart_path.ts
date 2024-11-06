import type { Denops } from "jsr:@denops/std@^7.3.0";
import { SEPARATOR } from "jsr:@std/path@^1.0.0/constants";

import type { Renderer, RenderParams } from "../../renderer.ts";
import { getByteLength } from "../_util.ts";

/**
 * A renderer to render smart paths.
 */
export class SmartPathRenderer<T> implements Renderer<T> {
  render(
    _denops: Denops,
    { items }: RenderParams<T>,
    { signal }: { signal?: AbortSignal },
  ) {
    for (const item of items) {
      signal?.throwIfAborted();

      const { label, decorations } = item;
      const index = label.lastIndexOf(SEPARATOR);
      if (index === -1) {
        continue;
      }

      const filename = label.substring(index + 1);
      const dirname = label.substring(0, index);
      const filenameLength = getByteLength(filename);
      const dirnameLength = getByteLength(dirname);
      const project = (n: number): number => {
        if (n > index) {
          return n - index - 1;
        } else {
          return n + filenameLength + 1;
        }
      };

      item.label = `${filename} ${dirname}`;
      item.decorations = [
        ...decorations.map((v) => ({
          ...v,
          column: project(v.column),
        })),
        {
          column: filenameLength + 1,
          length: dirnameLength + 1,
          highlight: "Comment",
        },
      ];
    }
  }
}
