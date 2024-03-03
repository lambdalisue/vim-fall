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

  start({ signal }: { signal?: AbortSignal }): void {
    if (signal?.aborted) return;
    signal?.addEventListener("abort", () => {
      this.stop();
    });
    const start = () => {
      this.#timer = setTimeout(async () => {
        if (signal?.aborted) return;
        try {
          await this.#callback();
          start();
        } catch (err) {
          // Avoid unhandled rejection
          console.error(`[fall] ${err}`);
        }
      }, this.#interval);
    };
    start();
  }

  stop(): void {
    if (this.#timer != undefined) {
      clearTimeout(this.#timer);
      this.#timer = undefined;
    }
  }

  [Symbol.dispose]() {
    this.stop();
  }
}
