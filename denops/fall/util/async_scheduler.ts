/**
 * Start asynchronous scheduler
 *
 * It periodically calls the given asynchronous callback function
 * with the given interval without overlapping.
 * It means that the next call is scheduled after the previous call
 * is finished.
 *
 * The scheduler stops when the callback throws an error or returned
 * disposable is disposed.
 */
export function startAsyncScheduler(
  callback: () => Promise<void>,
  interval: number,
  { signal }: { signal?: AbortSignal } = {},
): Disposable {
  if (signal?.aborted) {
    return {
      [Symbol.dispose]() {},
    };
  }
  let timer: number | undefined;
  const stop = () => {
    if (timer != undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
  };
  signal?.addEventListener("abort", stop);
  const start = () => {
    timer = setTimeout(async () => {
      if (signal?.aborted) return;
      try {
        await callback();
        start();
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        console.error(
          `[fall] Unexpected error occured in asyncrhonous scheduler: ${err}`,
        );
      }
    }, interval);
  };
  start();
  return {
    [Symbol.dispose]() {
      stop();
    },
  };
}
