import type { Item, SourceItem } from "../extension/type.ts";
import { dispatch } from "../util/event.ts";
import { DynamicChunkStream } from "../util/dynamic_chunk_stream.ts";

const truncate = Symbol("truncate");

export type Options = {
  threshold?: number;
};

/**
 * Item collector that collects items from the stream and stores in the `items` attribute.
 */
export class ItemCollector implements Disposable {
  readonly #stream: ReadableStream<SourceItem>;
  readonly #threshold: number;

  #controller = new AbortController();
  #processing = false;
  #truncated = false;
  #items: Item[] = [];

  constructor({
    stream,
    threshold,
  }: {
    readonly stream: ReadableStream<SourceItem>;
    readonly threshold?: number;
  }) {
    this.#stream = stream;
    this.#threshold = threshold ?? THRESHOLD;
  }

  get processing(): boolean {
    return this.#processing;
  }

  get truncated(): boolean {
    return this.#truncated;
  }

  get items(): readonly Item[] {
    return this.#items;
  }

  /**
   * Start collecting items from the stream.
   *
   * It dispatches the following events:
   *
   * - `item-collector-changed`: When new items are collected.
   * - `item-collector-succeeded`: When collecting items is succeeded.
   * - `item-collector-failed`: When collecting items is failed.
   * - `item-collector-completed`: When collecting items is succeeded or failed.
   *
   * Note that when case of aborting, `item-collector-failed` is not dispatched.
   * To check if the collecting is completed, you should use `item-collector-completed`.
   */
  async start(options: {
    readonly signal: AbortSignal;
  }): Promise<void> {
    this.#abort(); // Cancel previous process
    const signal = AbortSignal.any([
      this.#controller.signal,
      options.signal,
    ]);
    this.#processing = true;
    try {
      await this.#stream
        .pipeThrough(
          new DynamicChunkStream((chunks) => {
            const chunkSize = calcChunkSize(this.#items.length);
            return chunkSize <= chunks.length;
          }),
          { signal },
        )
        .pipeTo(
          new WritableStream({
            write: (chunk, controller) => {
              this.#items.push(...toItems(chunk, this.#items.length));
              dispatch("item-collector-changed", undefined);
              if (this.#items.length >= this.#threshold) {
                controller.error(truncate);
              }
            },
          }),
          { signal },
        );
      this.#processing = false;
      dispatch("item-collector-succeeded", undefined);
    } catch (err) {
      this.#processing = false;
      if (err === truncate) {
        this.#truncated = true;
        dispatch("item-collector-succeeded", undefined);
        return;
      }
      if (err instanceof DOMException && err.name === "AbortError") return;
      dispatch("item-collector-failed", undefined);
      const m = err.message ?? err;
      console.warn(`[fall] Failed to collect items from the stream: ${m}`);
    } finally {
      dispatch("item-collector-completed", undefined);
    }
  }

  #abort(): void {
    try {
      this.#controller.abort();
    } catch {
      // Fail silently
    }
    this.#controller = new AbortController();
  }

  [Symbol.dispose]() {
    this.#abort();
  }
}

function toItems(
  items: readonly SourceItem[],
  offset: number,
): readonly Item[] {
  return items.map((v, i) => ({
    detail: {},
    decorations: [],
    ...v,
    id: (i + offset).toString(),
  }));
}

function calcChunkSize(length: number): number {
  if (length < 100) {
    return 10;
  } else if (length < 1000) {
    return 100;
  }
  return 1000;
}

const THRESHOLD = 20000;
