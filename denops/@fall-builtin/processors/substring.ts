import type {
  ItemDecoration,
  Processor,
} from "https://deno.land/x/fall_core@v0.3.0/mod.ts";
import { collect } from "https://deno.land/x/denops_std@v6.3.0/batch/mod.ts";
import * as opt from "https://deno.land/x/denops_std@v6.3.0/option/mod.ts";
import { assert, is } from "https://deno.land/x/unknownutil@v3.16.3/mod.ts";

const isOptions = is.StrictOf(is.PartialOf(is.ObjectOf({
  smartCase: is.Boolean,
  ignoreCase: is.Boolean,
})));

export function getProcessor(
  options: Record<string, unknown>,
): Processor {
  assert(options, isOptions);
  let flag = options.smartCase === undefined && options.ignoreCase === undefined
    ? "auto"
    : options.smartCase
    ? "smart"
    : options.ignoreCase
    ? "ignore"
    : "none";
  return {
    getStream: async (denops, query) => {
      if (flag === "auto") {
        const [s, i] = await collect(denops, (denops) => [
          opt.smartcase.get(denops),
          opt.ignorecase.get(denops),
        ]);
        flag = s ? "smart" : i ? "ignore" : "none";
      }
      const ignoreCase = flag === "ignore" ||
        (flag === "smart" && query.toLowerCase() === query);
      const norm = (v: string): string => ignoreCase ? v.toLowerCase() : v;
      const terms = query
        .split(/\s+/)
        .filter((v) => v.length > 0)
        .map(norm);
      if (terms.length === 0) {
        return undefined;
      }
      const pattern = new RegExp(terms.join("|"), ignoreCase ? "ig" : "g");
      return new TransformStream({
        transform(chunk, controller) {
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
          controller.enqueue({
            ...chunk,
            label,
            decorations,
          });
        },
      });
    },
  };
}

function getByteLength(str: string): number {
  return new TextEncoder().encode(str).length;
}
