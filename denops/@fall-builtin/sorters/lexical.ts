import type { Denops } from "https://deno.land/x/denops_std@v6.3.0/mod.ts";
import { assert, is } from "https://deno.land/x/unknownutil@v3.16.3/mod.ts";

import type { Processor } from "../../fall/types.ts";

const isOptions = is.StrictOf(is.PartialOf(is.ObjectOf({
  direction: is.LiteralOneOf(["asc", "desc"] as const),
})));

export default function factory(
  _denops: Denops,
  options: Record<string, unknown>,
): Processor {
  assert(options, isOptions);
  const alpha = options.direction === "desc" ? -1 : 1;
  return (_denops, items) => {
    return items.toSorted((a, b) => {
      return a.value.localeCompare(b.value) * alpha;
    });
  };
}