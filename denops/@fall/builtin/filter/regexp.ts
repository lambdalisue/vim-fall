import { defineProjector, type Projector } from "../../projector.ts";

type Options = {
  includes: RegExp[];
  excludes?: undefined;
} | {
  includes?: undefined;
  excludes: RegExp[];
} | {
  includes: RegExp[];
  excludes: RegExp[];
};

type Detail = {
  path: string;
};

export function regexp<T extends Detail>(
  { includes, excludes }: Readonly<Options>,
): Projector<T> {
  return defineProjector<T>(async function* (_denops, { items }, { signal }) {
    signal?.throwIfAborted();
    for await (const item of items) {
      signal?.throwIfAborted();
      if (includes && !includes.some((r) => r.test(item.value))) {
        continue;
      }
      if (excludes && excludes.some((r) => r.test(item.value))) {
        continue;
      }
      yield item;
    }
  });
}
