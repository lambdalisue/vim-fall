import { defineSorter, type Sorter } from "../../sorter.ts";

type Options = {
  reverse?: boolean;
};

export function lexical<T>(options: Readonly<Options> = {}): Sorter<T> {
  const reverse = options.reverse ?? false;
  return defineSorter<T>((_denops, { items }, _options) => {
    if (reverse) {
      items.sort((a, b) =>
        b.value < a.value ? -1 : (b.value > a.value ? 1 : 0)
      );
    } else {
      items.sort((a, b) =>
        a.value < b.value ? -1 : (a.value > b.value ? 1 : 0)
      );
    }
  });
}
