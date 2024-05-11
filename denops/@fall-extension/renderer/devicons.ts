import type { GetRenderer } from "https://deno.land/x/fall_core@v0.9.0/mod.ts";
import { collect } from "https://deno.land/x/denops_std@v6.3.0/batch/mod.ts";
import { zip } from "jsr:@std/collections@0.224.1/zip";
import { is } from "jsr:@core/unknownutil@3.18.0";

import { getByteLength } from "../util.ts";

const isPathDetail = is.ObjectOf({
  path: is.String,
});

export const getRenderer: GetRenderer = (denops, _options) => {
  return {
    async render({ items }, { signal }) {
      if (signal?.aborted) return items;

      const paths = items.map((v) => {
        if (isPathDetail(v.detail)) {
          return v.detail.path;
        }
        return "";
      });
      const icons = await collect(
        denops,
        (denops) =>
          paths.map((v) =>
            denops.call("WebDevIconsGetFileTypeSymbol", v, 0) as Promise<string>
          ),
      );
      if (signal?.aborted) return items;

      return zip(items, icons).map(([item, icon]) => {
        const prefix = `${icon}  `;
        const offset = getByteLength(prefix);
        const decorations = (item.decorations ?? []).map((v) => ({
          ...v,
          column: v.column + offset,
        }));
        return {
          ...item,
          decorations,
          label: `${prefix}${item.label ?? item.value}`,
        };
      });
    },
  };
};
