export class Scheduler implements Disposable {
  #timer?: number;
  #interval: number;

  constructor(interval: number) {
    this.#interval = interval;
  }

  #tick(
    callback: () => void | Promise<void>,
    { reject, signal }: {
      reject: (reason: unknown) => void;
      signal?: AbortSignal;
    },
  ): void {
    this.#timer = setTimeout(async () => {
      if (!this.#timer || signal?.aborted) return;
      try {
        await callback();
        if (!this.#timer || signal?.aborted) return;
        this.#tick(callback, { reject, signal });
      } catch (err) {
        reject(err);
      }
    }, this.#interval);
  }

  start(
    callback: () => void | Promise<void>,
    { signal }: { signal?: AbortSignal } = {},
  ): Promise<never> {
    if (this.#timer !== undefined) {
      return Promise.reject(new Error("Scheduler is already started"));
    }
    return new Promise((_, reject) => {
      this.#tick(callback, { reject, signal });
    });
  }

  stop(): void {
    clearTimeout(this.#timer);
    this.#timer = undefined;
  }

  [Symbol.dispose](): void {
    this.stop();
  }
}
