import type { Denops } from "https://deno.land/x/denops_std@v6.3.0/mod.ts";
import { collect } from "https://deno.land/x/denops_std@v6.3.0/batch/mod.ts";
import { zip } from "https://deno.land/std@0.218.2/collections/zip.ts";
import { assert, is } from "https://deno.land/x/unknownutil@v3.16.3/mod.ts";

import type { Processor } from "../../fall/types.ts";

const defaultUnknownIcon = "";

const isOptions = is.StrictOf(is.PartialOf(is.ObjectOf({
  unknownIcon: is.String,
})));

const isPathDetail = is.ObjectOf({
  path: is.String,
});

export default function factory(
  _denops: Denops,
  options: Record<string, unknown>,
): Processor {
  assert(options, isOptions);
  const unknownIcon = options.unknownIcon ?? defaultUnknownIcon;
  return async (denops, items) => {
    const paths = items.map((v) => {
      if (isPathDetail(v)) {
        return v.path;
      }
      return v.value;
    });
    const icons = await collect(
      denops,
      (denops) =>
        paths.map((v) =>
          denops.call("nerdfont#find", v, false) as Promise<string>
        ),
    );
    return zip(items, icons).map(([item, icon]) => {
      const prefix = `${icon || unknownIcon}  `;
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
  };
}

function getByteLength(str: string): number {
  return new TextEncoder().encode(str).length;
}
