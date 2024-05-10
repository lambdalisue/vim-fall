import type { GetRenderer } from "https://deno.land/x/fall_core@v0.9.0/mod.ts";
import { SEPARATOR } from "jsr:@std/path@0.225.0/constants";
import { getByteLength } from "../utils.ts";

export const getRenderer: GetRenderer = (_denops, _options) => {
  return {
    render({ items }, { signal }) {
      if (signal?.aborted) return items;

      return items.map((v) => {
        const label = v.label ?? v.value;
        const index = label.lastIndexOf(SEPARATOR);
        if (index === -1) return v;

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
        return {
          ...v,
          label: `${filename} ${dirname}`,
          decorations: [
            ...v.decorations.map((v) => ({ ...v, column: project(v.column) })),
            {
              column: filenameLength + 1,
              length: dirnameLength + 1,
              highlight: "Comment",
            },
          ],
        };
      });
    },
  };
};
