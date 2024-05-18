/**
 * Reduce the number of function call via debouncing
 */
// deno-lint-ignore no-explicit-any
export function debounce<F extends (...args: any[]) => void>(
  fn: F,
  wait: number,
): F {
  let timer = 0;
  globalThis.addEventListener("beforeunload", () => {
    clearTimeout(timer);
  });
  return ((...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn(...args);
    }, wait);
  }) as F;
}
