/**
 * Return if the value is defined.
 */
export function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

/**
 * Return true if any of the values are true.
 */
export function any(values: boolean[]): boolean {
  return values.some((v) => v);
}
