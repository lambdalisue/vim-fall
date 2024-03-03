import type { Denops } from "https://deno.land/x/denops_std@v6.3.0/mod.ts";
import { assert, is } from "https://deno.land/x/unknownutil@v3.16.3/mod.ts";

import type { Source } from "../../fall/types.ts";

const isOptions = is.StrictOf(is.ObjectOf({
  items: is.ArrayOf(is.ObjectOf({
    value: is.String,
    label: is.OptionalOf(is.String),
    detail: is.Unknown,
  })),
}));

export default function factory(
  _denops: Denops,
  options: Record<string, unknown>,
): Source {
  assert(options, isOptions);
  const items = options.items;
  return (_denops, ..._args) => {
    return ReadableStream.from(items);
  };
}
