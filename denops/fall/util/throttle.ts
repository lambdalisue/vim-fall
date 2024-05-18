/**
 * Reduce the number of function call via throttling.
 */
// deno-lint-ignore no-explicit-any
export function throttle<F extends (...args: any[]) => void>(
  fn: F,
  wait: number,
): F {
  let timer = 0;
  let lastTime: null | number = null;
  globalThis.addEventListener("beforeunload", () => {
    clearTimeout(timer);
  });
  return ((...args: Parameters<F>): void => {
    if (!lastTime) {
      lastTime = performance.now();
      fn(...args);
      return;
    }
    clearTimeout(timer);
    timer = setTimeout(() => {
      lastTime = performance.now();
      fn(...args);
    }, wait - Math.max(0, performance.now() - lastTime));
  }) as F;
}
