import type { Denops } from "https://deno.land/x/denops_std@v6.3.0/mod.ts";
import type {
  Processor,
  ProcessorItem,
} from "https://deno.land/x/fall_core@v0.3.0/mod.ts";

import { isDefined } from "../../util/collection.ts";
import { dispatch } from "../../util/event.ts";

export class ItemProcessor implements Disposable {
  #controller: AbortController = new AbortController();
  #processors: Map<string, Processor>;

  #items: ProcessorItem[] = [];

  constructor(processors: Map<string, Processor>) {
    this.#processors = processors;
  }

  get items(): ProcessorItem[] {
    return this.#items;
  }

  start(
    denops: Denops,
    items: ProcessorItem[],
    query: string,
  ): void {
    this.#abort(); // Cancel previous processing

    const { signal } = this.#controller;
    const inner = async () => {
      const transformers = await getProcessorStreams(
        denops,
        query,
        this.#processors,
      );
      if (signal.aborted) return;

      const stream = transformers.reduce(
        (acc, v) => acc.pipeThrough(v, { signal }),
        ReadableStream.from(items),
      );

      const processedItems: ProcessorItem[] = [];
      await stream.pipeTo(
        new WritableStream({
          write: (chunk) => {
            processedItems.push(chunk);
          },
        }),
        { signal },
      );
      this.#items = processedItems;
      dispatch("item-processor-succeeded", undefined);
    };
    inner()
      .catch((err) => {
        if (err.name === "AbortError") return;
        console.warn(`[fall] Failed to process items: ${err}`);
        dispatch("item-processor-failed", undefined);
      })
      .finally(() => {
        dispatch("item-processor-completed", undefined);
      });
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

async function getProcessorStreams(
  denops: Denops,
  query: string,
  processors: Map<string, Processor>,
) {
  const promises = [...processors.entries()]
    .map(async ([name, v]) => {
      try {
        return await v.getStream(denops, query);
      } catch (err) {
        console.warn(
          `[fall] Failed to get transform stream from processor ${name}: ${err}`,
        );
      }
      return undefined;
    });
  return (await Promise.all(promises)).filter(isDefined);
}
