import type { GetProjector } from "../../@fall/projector.ts";
import type { ItemDecoration } from "../../@fall/item.ts";
import { collect } from "https://deno.land/x/denops_std@v6.4.0/batch/mod.ts";
import * as opt from "https://deno.land/x/denops_std@v6.4.0/option/mod.ts";
import { assert, is } from "jsr:@core/unknownutil@3.18.0";

import { getByteLength } from "../util.ts";

const isOptions = is.StrictOf(is.PartialOf(is.ObjectOf({
  smartCase: is.Boolean,
  ignoreCase: is.Boolean,
})));

export const getProjector: GetProjector = async (denops, options) => {
  assert(options, isOptions);
  let flag = options.smartCase === undefined && options.ignoreCase === undefined
    ? "auto"
    : options.smartCase
    ? "smart"
    : options.ignoreCase
    ? "ignore"
    : "none";
  if (flag === "auto") {
    const [s, i] = await collect(denops, (denops) => [
      opt.smartcase.get(denops),
      opt.ignorecase.get(denops),
    ]);
    flag = s ? "smart" : i ? "ignore" : "none";
  }
  return {
    project({ query, items }, { signal }) {
      if (signal?.aborted) return items;

      const ignoreCase = flag === "ignore" ||
        (flag === "smart" && query.toLowerCase() === query);
      const norm = (v: string): string => ignoreCase ? v.toLowerCase() : v;
      const terms = query
        .split(/\s+/)
        .filter((v) => v.length > 0)
        .map(norm);
      if (terms.length === 0) {
        return items;
      }
      const pattern = new RegExp(terms.join("|"), ignoreCase ? "ig" : "g");
      return items
        .map((chunk) => {
          if (terms.some((term) => !norm(chunk.value).includes(term))) {
            return;
          }
          const label = chunk.label ?? chunk.value;
          const matches = [...label.matchAll(pattern)];
          const decorations: ItemDecoration[] = matches
            .map((match) => {
              const length = match[0].length;
              const index = match.index ?? 0;
              const head = label.slice(0, index);
              const column = 1 + getByteLength(head);
              return { column, length };
            });
          return {
            ...chunk,
            label,
            decorations: [...chunk.decorations, ...decorations],
          };
        })
        .filter(isDefined);
    },
  };
};

function isDefined<T>(x: T | undefined): x is T {
  return x != undefined;
}
