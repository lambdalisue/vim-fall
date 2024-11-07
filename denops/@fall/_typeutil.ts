export type FlatType<T> = T extends Record<PropertyKey, unknown>
  ? { [K in keyof T]: FlatType<T[K]> }
  : T;

export type LastType<T extends unknown[]> = T extends [...infer _, infer L] ? L
  : never;
