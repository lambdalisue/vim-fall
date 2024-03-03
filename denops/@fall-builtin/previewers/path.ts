import type { Denops } from "https://deno.land/x/denops_std@v6.3.0/mod.ts";
import { assert, is } from "https://deno.land/x/unknownutil@v3.16.3/mod.ts";

import type { Previewer } from "../../fall/types.ts";

const isOptions = is.StrictOf(is.PartialOf(is.ObjectOf({})));

const isPathDetail = is.ObjectOf({
  path: is.String,
  line: is.OptionalOf(is.Number),
  column: is.OptionalOf(is.Number),
});

export default function factory(
  _denops: Denops,
  options: Record<string, unknown>,
): Previewer {
  assert(options, isOptions);
  return (_denops, item) => {
    if (isPathDetail(item.detail)) {
      return item.detail;
    }
    return;
  };
}
