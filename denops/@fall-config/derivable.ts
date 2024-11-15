// deno-lint-ignore-file no-explicit-any
type NonFunction<T> = T extends (...args: any[]) => any ? never : T;

/**
 * A type that represents a value that can be either `T` or a function that returns `T`.
 * Ensures `T` is not a function type.
 */
export type Derivable<T extends NonFunction<unknown>> = T | (() => T);

/**
 * A map type where each property can either be of type `T` or a function that returns `T`.
 */
export type DerivableMap<M extends Record<string, NonFunction<unknown>>> = {
  [K in keyof M]: Derivable<M[K]>;
};

/**
 * An array type where each element can either be of type `T` or a function that returns `T`.
 */
export type DerivableArray<A extends NonFunction<unknown>[]> = {
  [K in keyof A]: Derivable<A[K]>;
};

/**
 * Gets the value of a derivable, resolving it if it is a function.
 *
 * @param value - The derivable value or function.
 * @returns The resolved value of type `T`.
 */
export function derive<T extends NonFunction<unknown>>(value: Derivable<T>): T {
  return value instanceof Function ? value() : value;
}

/**
 * Resolves all derivables in a map, returning the resolved values.
 *
 * @param map - An object where each property may be a derivable.
 * @returns A new object with each property resolved.
 */
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

/**
 * Resolves all derivables in an array, returning the resolved values.
 *
 * @param array - An array where each element may be a derivable.
 * @returns A new array with each element resolved.
 */
export function deriveArray<
  A extends NonFunction<any>[],
  R extends { [K in keyof A]: A[K] extends Derivable<infer T> ? T : A[K] },
>(array: A): R {
  return array.map((v) => derive(v)) as R;
}
