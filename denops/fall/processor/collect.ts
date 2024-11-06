import type { Denops } from "jsr:@denops/std@^7.3.0";
import { chunked } from "jsr:@core/iterutil@^0.9.0/async/chunked";
import { take } from "jsr:@core/iterutil@^0.9.0/async/take";

import type { IdItem } from "../../@fall/item.ts";
import type { CollectParams, Source } from "../../@fall/source.ts";
import { dispatch } from "../event.ts";

const THRESHOLD = 100000;
const CHUNK_SIZE = 1000;

export type CollectProcessorOptions = {
  threshold?: number;
  chunkSize?: number;
};

export class CollectProcessor<T> implements Disposable {
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

  start(
    denops: Denops,
    params: CollectParams,
  ): void | Promise<void> {
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
      for await (const chunk of chunked(iter, this.#chunkSize)) {
        if (this.#paused) await this.#paused.promise;
        signal.throwIfAborted();
        const offset = this.#items.length;
        this.#items.push(
          ...chunk.map((item, i) => ({ ...item, id: i + offset })),
        );
        dispatch({ type: "collect-processor-updated" });
      }
      dispatch({ type: "collect-processor-succeeded" });
    })();
    this.#processing
      .catch((err) => {
        dispatch({ type: "collect-processor-failed", err });
      });
  }

  pause(): void {
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
