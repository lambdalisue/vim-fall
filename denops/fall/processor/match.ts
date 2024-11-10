import type { Denops } from "jsr:@denops/std@^7.3.0";
import { delay } from "jsr:@std/async@^1.0.0/delay";
import { chunked } from "jsr:@core/iterutil@^0.9.0/async/chunked";
import { take } from "jsr:@core/iterutil@^0.9.0/async/take";
import { toAsyncIterable } from "jsr:@core/iterutil@^0.9.0/async/to-async-iterable";
import type { Detail, IdItem } from "jsr:@vim-fall/std@^0.2.0/item";
import type { Matcher, MatchParams } from "jsr:@vim-fall/std@^0.2.0/matcher";

import { dispatch } from "../event.ts";

const INTERVAL = 0;
const THRESHOLD = 100000;
const CHUNK_SIZE = 1000;

export type MatchProcessorOptions = {
  interval?: number;
  threshold?: number;
  chunkSize?: number;
};

export class MatchProcessor<T extends Detail> {
  #filter: Matcher<T>;
  #interval: number;
  #threshold: number;
  #chunkSize: number;
  #controller: AbortController = new AbortController();
  #processing?: Promise<void>;
  #reserved?: () => void;
  #paused?: PromiseWithResolvers<void>;
  #items: IdItem<T>[] = [];

  constructor(
    filter: Matcher<T>,
    options: MatchProcessorOptions = {},
  ) {
    this.#filter = filter;
    this.#interval = options.interval ?? INTERVAL;
    this.#threshold = options.threshold ?? THRESHOLD;
    this.#chunkSize = options.chunkSize ?? CHUNK_SIZE;
  }

  get items(): IdItem<T>[] {
    return this.#items;
  }

  start(
    denops: Denops,
    { items, query }: MatchParams<T>,
    options?: { restart?: boolean },
  ): void {
    if (this.#processing) {
      this.#resume();
      // Keep most recent start request for later.
      this.#reserved = () => this.start(denops, { items, query }, options);
      if (options?.restart) {
        this.#controller.abort(null);
        this.#controller = new AbortController();
      }
      return;
    }
    this.#processing = (async () => {
      dispatch({ type: "match-processor-started" });
      const signal = this.#controller.signal;
      const iter = take(
        query === ""
          ? toAsyncIterable(items)
          : this.#filter.match(denops, { items, query }, { signal }),
        this.#threshold,
      );
      // Gradually update items when `items` is empty to improve latency
      // of Curator.
      const matchedItems = items.length === 0
        ? (this.#items = [], this.#items)
        : [];
      for await (const chunk of chunked(iter, this.#chunkSize)) {
        if (this.#paused) await this.#paused.promise;
        signal.throwIfAborted();
        matchedItems.push(...chunk);
        dispatch({ type: "match-processor-updated" });
        await delay(this.#interval, { signal });
      }
      this.#items = matchedItems;
      dispatch({ type: "match-processor-succeeded" });
    })();
    this.#processing
      .catch((err) => {
        dispatch({ type: "match-processor-failed", err });
      })
      .finally(() => {
        this.#processing = undefined;
      })
      .then(() => {
        this.#reserved?.();
        this.#reserved = undefined;
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

  [Symbol.dispose]() {
    try {
      this.#controller.abort(null);
    } catch {
      // Ignore
    }
  }
}
