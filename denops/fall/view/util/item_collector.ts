import type { Item, SourceItem } from "../../extension/type.ts";
import { ChunkStream } from "../../util/stream.ts";
import { dispatch } from "../../util/event.ts";

/**
 * Collect items from the given stream and store them in the internal state.
 */
export class ItemCollector implements Disposable {
  #stream: ReadableStream<SourceItem>;

  #controller?: AbortController;
  #items: Item[] = [];

  constructor(stream: ReadableStream<SourceItem>) {
    this.#stream = stream;
  }

  /**
   * Collected items
   */
  get items(): readonly Item[] {
    return this.#items;
  }

  /**
   * Start collecting items from the source stream.
   *
   * It dispatch the following events:
   *
   * - `item-collector-changed`: When new items are collected.
   * - `item-collector-succeeded`: When collecting items is succeeded.
   * - `item-collector-failed`: When collecting items is failed.
   * - `item-collector-completed`: When collecting items is succeeded or failed.
   *
   * Note that when case of aborting, `item-collector-failed` is not dispatched.
   * To check if the collecting is completed, you should use `item-collector-completed`.
   */
  start(): void {
    if (this.#controller) {
      throw new Error("ItemCollector is already started");
    }
    this.#start().catch((err) => {
      console.warn(
        `[fall] Error in reading source steam: ${err.message ?? err}`,
      );
    });
  }

  async #start(): Promise<void> {
    this.#controller = new AbortController();
    const { signal } = this.#controller;
    try {
      await this.#stream
        .pipeThrough(
          new ChunkStream(calcChunkSize(this.#items.length)),
          {
            signal,
          },
        )
        .pipeTo(
          new WritableStream({
            write: (chunk) => {
              const offset = this.#items.length;
              this.#items.push(...toItems(chunk, offset));
              dispatch("item-collector-changed", undefined);
            },
          }),
          { signal },
        );
      dispatch("item-collector-succeeded", undefined);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      dispatch("item-collector-failed", undefined);
      throw err;
    } finally {
      dispatch("item-collector-completed", undefined);
    }
  }

  [Symbol.dispose]() {
    try {
      this.#controller?.abort();
    } catch {
      // Fail silently
    }
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
  if (length > 10000) {
    return 1000;
  } else if (length > 1000) {
    return 100;
  }
  return 10;
}
