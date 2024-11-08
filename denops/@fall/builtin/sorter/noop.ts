import { defineSorter, type Sorter } from "../../sorter.ts";

export function noop<T>(): Sorter<T> {
  return defineSorter<T>(() => {});
}
