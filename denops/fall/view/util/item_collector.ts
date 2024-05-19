import type { Item, SourceItem } from "../../extension/type.ts";
import { dispatch } from "../../util/event.ts";
import { DynamicChunkStream } from "../../util/dynamic_chunk_stream.ts";

/**
 * Item collector that collects items from the stream and stores in the `items` attribute.
 */
export class ItemCollector implements Disposable {
  #controller = new AbortController();
  #stream: ReadableStream<SourceItem>;

  #collecting = false;
  #items: Item[] = [];

  constructor(stream: ReadableStream<SourceItem>) {
    this.#stream = stream;
  }

  get collecting(): boolean {
    return this.#collecting;
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
  async start(options: { signal: AbortSignal }): Promise<void> {
    this.#abort(); // Cancel previous processing
    const signal = AbortSignal.any([
      this.#controller.signal,
      options.signal,
    ]);
    try {
      this.#collecting = true;
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
            write: (chunk) => {
              this.#items.push(...toItems(chunk, this.#items.length));
              dispatch("item-collector-changed", undefined);
            },
          }),
          { signal },
        );
      this.#collecting = false;
      dispatch("item-collector-succeeded", undefined);
    } catch (err) {
      this.#collecting = false;
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
