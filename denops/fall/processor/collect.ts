import type { Denops } from "jsr:@denops/std@^7.3.0";
import { take } from "jsr:@core/iterutil@^0.9.0/async/take";
import type { Detail, IdItem } from "jsr:@vim-fall/std@^0.2.0/item";
import type { CollectParams, Source } from "jsr:@vim-fall/std@^0.2.0/source";

import { dispatch } from "../event.ts";

const THRESHOLD = 100000;
const CHUNK_SIZE = 1000;

export type CollectProcessorOptions = {
  threshold?: number;
  chunkSize?: number;
};

export class CollectProcessor<T extends Detail> implements Disposable {
  readonly #source: Source<T>;
  readonly #threshold: number;
  readonly #chunkSize: number;
  #controller: AbortController = new AbortController();
  #processing?: Promise<void>;
  #paused?: PromiseWithResolvers<void>;
  #items: IdItem<T>[] = [];

  constructor(
    source: Source<T>,
    options: CollectProcessorOptions = {},
  ) {
    this.#source = source;
    this.#threshold = options.threshold ?? THRESHOLD;
    this.#chunkSize = options.chunkSize ?? CHUNK_SIZE;
  }

  get items() {
    return this.#items;
  }

  #validateAvailability(): void {
    try {
      this.#controller.signal.throwIfAborted();
    } catch (err) {
      if (err === null) {
        throw new Error("The processor is already disposed");
      }
      throw err;
    }
  }

  start(
    denops: Denops,
    params: CollectParams,
  ): void | Promise<void> {
    this.#validateAvailability();
    if (this.#processing) {
      this.#resume();
      return;
    }
    this.#processing = (async () => {
      dispatch({ type: "collect-processor-started" });
      const signal = this.#controller.signal;
      const iter = take(
        this.#source.collect(denops, params, { signal }),
        this.#threshold,
      );
      const update = (chunk: IdItem<T>[]) => {
        const offset = this.#items.length;
        this.#items.push(
          ...chunk.map((item, i) => ({ ...item, id: i + offset })),
        );
        dispatch({ type: "collect-processor-updated" });
      };
      let chunk = [];
      for await (const item of iter) {
        if (this.#paused) await this.#paused.promise;
        signal.throwIfAborted();
        chunk.push(item);
        if (chunk.length >= this.#chunkSize) {
          update(chunk);
          chunk = [];
        }
      }
      if (chunk.length > 0) {
        update(chunk);
      }
      dispatch({ type: "collect-processor-succeeded" });
    })();
    this.#processing
      .catch((err) => {
        dispatch({ type: "collect-processor-failed", err });
      });
  }

  pause(): void {
    this.#validateAvailability();
    if (!this.#processing) {
      return;
    }
    this.#paused = Promise.withResolvers<void>();
    this.#controller.signal.addEventListener("abort", () => {
      this.#paused?.resolve();
    });
  }

  #resume(): void {
    if (!this.#paused) {
      return;
    }
    this.#paused.resolve();
    this.#paused = undefined;
  }

  [Symbol.dispose](): void {
    try {
      this.#controller.abort(null);
    } catch {
      // Ignore
    }
  }
}
