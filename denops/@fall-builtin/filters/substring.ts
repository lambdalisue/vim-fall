import type { Denops } from "https://deno.land/x/denops_std@v6.3.0/mod.ts";
import { assert, is } from "https://deno.land/x/unknownutil@v3.16.3/mod.ts";

import type { Filter, ItemDecoration } from "../../fall/types.ts";

const isOptions = is.StrictOf(is.PartialOf(is.ObjectOf({
  ignoreCase: is.Boolean,
})));

export default function factory(
  _denops: Denops,
  options: Record<string, unknown>,
): Filter {
  assert(options, isOptions);
  const ignoreCase = options.ignoreCase ?? false;
  return (_denops, items, query) => {
    const terms = query
      .split(/\s+/)
      .filter((v) => v.length > 0)
      .map((v) => ignoreCase ? v.toLowerCase() : v);
    if (terms.length === 0) {
      return items;
    }
    const pattern = new RegExp(terms.join("|"), ignoreCase ? "ig" : "g");
    return items
      .filter((v) => terms.every((term) => v.value.includes(term)))
      .map((v) => {
        const matches = [...(v.label ?? v.value).matchAll(pattern)];
        const decorations: ItemDecoration[] = matches
          .map((match) => {
            const length = match[0].length;
            const index = match.index ?? 0;
            const head = (v.label ?? v.value).slice(0, index);
            const column = 1 + getByteLength(head);
            return { column, length };
          });
        return {
          ...v,
          label: v.label ?? v.value,
          decorations,
        };
      });
  };
}

function getByteLength(str: string): number {
  return new TextEncoder().encode(str).length;
}
