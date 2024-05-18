// NOTE: This file is used to define internal types that are not assumed to be used by the user.
export type Promish<T> = T | Promise<T>;

export type FlatType<T> = T extends Record<PropertyKey, unknown>
  ? { [K in keyof T]: FlatType<T[K]> }
  : T;
