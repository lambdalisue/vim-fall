import type { Item, Projector, Transformer } from "../../extension/type.ts";
import { dispatch } from "../../util/event.ts";

/**
 * Process items with a filter and a sorter and store them in the internal state.
 */
export class ItemProcessor implements Disposable {
  #controller: AbortController = new AbortController();
  #transformers: readonly Transformer[];
  #projectors: readonly Projector[];

  #items: readonly Item[] = [];

  constructor(
    transformers: readonly Transformer[],
    projectors: readonly Projector[],
  ) {
    this.#transformers = transformers;
    this.#projectors = projectors;
  }

  /**
   * Processed items
   */
  get items(): readonly Item[] {
    return this.#items;
  }

  /**
   * Start processing items with the given query.
   *
   * It dispatch the following events:
   *
   * - `item-processor-succeeded`: When processing items is succeeded.
   * - `item-processor-failed`: When processing items is failed.
   * - `item-processor-completed`: When processing items is succeeded or failed.
   *
   * Note that when case of aborting, `item-processor-failed` is not dispatched.
   * To check if the processing is completed, you should use `item-processor-completed`.
   */
  async start(
    items: readonly Item[],
    query: string,
    options: { signal: AbortSignal },
  ): Promise<void> {
    try {
      await this.#start(items, query, options);
      dispatch("item-processor-succeeded", undefined);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      const m = err.message ?? err;
      console.warn(`[fall] Failed to process items: ${m}`);
      dispatch("item-processor-failed", undefined);
    } finally {
      dispatch("item-processor-completed", undefined);
    }
  }

  async #start(
    items: readonly Item[],
    query: string,
    options: { signal: AbortSignal },
  ): Promise<void> {
    this.#abort(); // Cancel previous processing
    const signal = AbortSignal.any([
      this.#controller.signal,
      options.signal,
    ]);
    let stream = ReadableStream.from(items);
    for (const transformer of this.#transformers) {
      const transform = await transformer.transform({ query }, { signal });
      signal.throwIfAborted();
      if (transform) {
        stream = stream.pipeThrough(transform, { signal });
      }
    }

    const transformedItems: Item[] = [];
    await stream.pipeTo(
      new WritableStream({
        write: (chunk) => {
          transformedItems.push(chunk);
        },
      }),
      { signal },
    );
    signal.throwIfAborted();

    let projectedItems: readonly Item[] = transformedItems;
    for (const projector of this.#projectors) {
      projectedItems = await projector.project({
        query,
        items: projectedItems,
      }, {
        signal,
      });
      signal.throwIfAborted();
    }
    this.#items = projectedItems;
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
