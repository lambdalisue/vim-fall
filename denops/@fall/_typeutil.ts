export type Promish<T> = T | Promise<T>;

export type FlatType<T> = T extends Record<PropertyKey, unknown>
  ? { [K in keyof T]: FlatType<T[K]> }
  : T;

export type FirstType<T extends unknown[]> = T extends [infer F, ...infer _] ? F
  : never;

export type LastType<T extends unknown[]> = T extends [...infer _, infer L] ? L
  : never;
