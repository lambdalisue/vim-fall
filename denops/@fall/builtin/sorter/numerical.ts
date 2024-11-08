import type { IdItem } from "../../item.ts";
import { defineSorter, type Sorter } from "../../sorter.ts";

type Options<T> = {
  attrGetter?: (item: IdItem<T>) => unknown;
  reverse?: boolean;
};

export function numerical<T>(options: Readonly<Options<T>> = {}): Sorter<T> {
  const attrGetter = options.attrGetter ?? ((item: IdItem<T>) => item.value);
  const alpha = options.reverse ? -1 : 1;
  return defineSorter<T>((_denops, { items }, _options) => {
    items.sort((a, b) => {
      const va = attrGetter(a);
      const vb = attrGetter(b);
      const na = typeof va === "number" ? va : Number(va);
      const nb = typeof vb === "number" ? vb : Number(vb);
      if (isNaN(na) || isNaN(nb)) return 0;
      return Math.sign(na - nb) * alpha;
    });
  });
}
