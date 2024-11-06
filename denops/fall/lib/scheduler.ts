export class Scheduler implements Disposable {
  #timer?: number;
  #interval: number;

  constructor(interval: number) {
    this.#interval = interval;
  }

  #tick(
    callback: () => void | Promise<void>,
    { signal }: { signal?: AbortSignal } = {},
  ): void {
    this.#timer = setTimeout(async () => {
      if (!this.#timer || signal?.aborted) return;
      try {
        await callback();
        if (!this.#timer || signal?.aborted) return;
        this.#tick(callback, { signal });
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        const m = err instanceof Error ? err.message : String(err);
        console.error(`[fall] Unexpected error in Scheduler: ${m}`);
      }
    }, this.#interval);
  }

  start(
    callback: () => void | Promise<void>,
    { signal }: { signal?: AbortSignal } = {},
  ): void {
    if (this.#timer !== undefined) {
      throw new Error("Scheduler is already started");
    }
    this.#tick(callback, { signal });
  }

  stop(): void {
    clearTimeout(this.#timer);
    this.#timer = undefined;
  }

  [Symbol.dispose](): void {
    this.stop();
  }
}
