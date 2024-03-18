/**
 * A function that takes a value and an effect, and returns the value after the effect has been executed.
 */
export function withSideEffect<T>(value: T, effect: () => void): T {
  effect();
  return value;
}
