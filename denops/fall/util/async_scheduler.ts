/**
 * Asynchronous scheduler
 *
 * It is used to schedule asynchronous tasks at regular intervals.
 */
export class AsyncScheduler implements Disposable {
  #timer?: number;
  #callback: () => Promise<void>;
  #interval: number;

  constructor(
    callback: () => Promise<void>,
    interval: number,
  ) {
    this.#callback = callback;
    this.#interval = interval;
  }

  /**
   * Start the scheduler
   */
  start({ signal }: { signal?: AbortSignal } = {}): void {
    if (signal?.aborted) return;
    signal?.addEventListener("abort", () => {
      this.#stop();
    });
    const start = () => {
      this.#timer = setTimeout(async () => {
        if (signal?.aborted) return;
        try {
          await this.#callback();
          start();
        } catch (err) {
          // Avoid unhandled rejection
          console.error(
            `[fall] Unexpected error occured in asyncrhonous scheduler: ${err}`,
          );
        }
      }, this.#interval);
    };
    start();
  }

  #stop(): void {
    if (this.#timer != undefined) {
      clearTimeout(this.#timer);
      this.#timer = undefined;
    }
  }

  [Symbol.dispose]() {
    this.#stop();
  }
}

/**
 * Start an asynchronous scheduler
 */
export function startAsyncScheduler(
  callback: () => Promise<void>,
  interval: number,
  { signal }: { signal?: AbortSignal } = {},
): Disposable {
  const scheduler = new AsyncScheduler(callback, interval);
  scheduler.start({ signal });
  return scheduler;
}
