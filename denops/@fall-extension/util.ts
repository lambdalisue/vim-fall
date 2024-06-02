import { is, type Predicate } from "jsr:@core/unknownutil@3.18.1";

export function dig(obj: unknown, path: string): unknown {
  const inner = (obj: unknown, path: string[]): unknown => {
    if (!is.Record(obj)) {
      return undefined;
    }
    const [key, ...rest] = path;
    if (rest.length > 0) {
      return inner(obj[key], rest);
    }
    return obj[key];
  };
  return inner(obj, path.split("."));
}

export function retrieve<T>(
  obj: unknown,
  paths: string[],
  pred?: Predicate<T>,
): T | undefined {
  for (const path of paths) {
    const value = dig(obj, path);
    if (!is.Undefined(value)) {
      if (!pred || (pred && pred(value))) {
        return value as T;
      }
    }
  }
  return undefined;
}

export { getByteLength } from "../fall/util/text.ts";
