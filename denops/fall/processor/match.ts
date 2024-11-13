import type { Denops } from "jsr:@denops/std@^7.3.2";
import { delay } from "jsr:@std/async@^1.0.0/delay";
import { take } from "jsr:@core/iterutil@^0.9.0/async/take";
import type { Detail, IdItem } from "jsr:@vim-fall/std@^0.2.0/item";
import type { Matcher, MatchParams } from "jsr:@vim-fall/std@^0.2.0/matcher";

import { Chunker } from "../lib/chunker.ts";
import { dispose } from "../lib/dispose.ts";
import { dispatch } from "../event.ts";

const INTERVAL = 0;
const THRESHOLD = 100000;
const CHUNK_SIZE = 1000;

export type MatchProcessorOptions = {
  interval?: number;
  threshold?: number;
  chunkSize?: number;
  incremental?: boolean;
};

export class MatchProcessor<T extends Detail> implements AsyncDisposable {
  readonly #matchers: readonly [Matcher<T>, ...Matcher<T>[]];
  readonly #interval: number;
  readonly #threshold: number;
  readonly #chunkSize: number;
  readonly #incremental: boolean;
  #controller: AbortController = new AbortController();
  #processing?: Promise<void>;
  #reserved?: () => void;
  #items: IdItem<T>[] = [];
  #matcherIndex = 0;

  constructor(
    filters: readonly [Matcher<T>, ...Matcher<T>[]],
    options: MatchProcessorOptions = {},
  ) {
    this.#matchers = filters;
    this.#interval = options.interval ?? INTERVAL;
    this.#threshold = options.threshold ?? THRESHOLD;
    this.#chunkSize = options.chunkSize ?? CHUNK_SIZE;
    this.#incremental = options.incremental ?? false;
  }

  get #matcher(): Matcher<T> {
    return this.#matchers[this.#matcherIndex];
  }

  get items(): IdItem<T>[] {
    return this.#items;
  }

  get matcherCount(): number {
    return this.#matchers.length;
  }

  get matcherIndex(): number {
    return this.#matcherIndex;
  }

  set matcherIndex(index: number | "$") {
    if (index === "$" || index >= this.#matchers.length) {
      index = this.#matchers.length - 1;
    } else if (index < 0) {
      index = 0;
    }
    this.#matcherIndex = index;
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
    { items, query }: MatchParams<T>,
    options?: { restart?: boolean },
  ): void {
    this.#validateAvailability();
    if (this.#processing) {
      // Keep most recent start request for later.
      this.#reserved = () => this.start(denops, { items, query }, options);
      // If restart is requested, we need to abort the current processing.
      if (options?.restart) {
        // This abort will invoke function in `#reserved`.
        this.#controller.abort(null);
        this.#controller = new AbortController();
      }
      return;
    }
    this.#processing = (async () => {
      dispatch({ type: "match-processor-started" });
      const signal = this.#controller.signal;
      const iter = take(
        this.#matcher.match(denops, { items, query }, { signal }),
        this.#threshold,
      );
      const matchedItems: IdItem<T>[] = [];
      const update = (chunk: Iterable<IdItem<T>>) => {
        matchedItems.push(...chunk);
        // In immediate mode, we need to update items gradually to improve latency.
        if (this.#incremental) {
          this.#items = matchedItems;
          dispatch({ type: "match-processor-updated" });
        }
      };
      const chunker = new Chunker<IdItem<T>>(this.#chunkSize);
      for await (const item of iter) {
        signal.throwIfAborted();
        if (chunker.put(item)) {
          update(chunker.consume());
          await delay(this.#interval, { signal });
        }
      }
      if (chunker.count > 0) {
        update(chunker.consume());
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

  async [Symbol.asyncDispose]() {
    try {
      this.#controller.abort(null);
    } catch {
      // Ignore
    }
    await Promise.all(this.#matchers.map((v) => dispose(v)));
  }
}
