// deno-lint-ignore-file no-explicit-any
type NonFunction<T> = T extends (...args: any[]) => any ? never : T;

export type Derivable<T extends NonFunction<unknown>> = T | (() => T);

export type DerivableMap<M extends Record<string, NonFunction<unknown>>> = {
  [K in keyof M]: Derivable<M[K]>;
};

export type DerivableArray<A extends NonFunction<unknown>[]> = {
  [K in keyof A]: Derivable<A[K]>;
};

export function derive<T extends NonFunction<unknown>>(value: Derivable<T>): T {
  return value instanceof Function ? value() : value;
}

export function deriveMap<
  M extends Record<PropertyKey, unknown>,
  R extends { [K in keyof M]: M[K] extends Derivable<infer T> ? T : M[K] },
>(map: M): R {
  return Object.fromEntries(
    Object.entries(map).map(([k, v]) => {
      return [k, derive(v)];
    }),
  ) as R;
}

export function deriveArray<
  A extends NonFunction<unknown>[],
  R extends { [K in keyof A]: A[K] extends Derivable<infer T> ? T : A[K] },
>(array: A): R {
  return array.map((v) => derive(v)) as R;
}
