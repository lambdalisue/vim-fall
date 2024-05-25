import { equal } from "jsr:@std/assert@0.225.2/equal";

import type { Preview, Previewer, PreviewerItem } from "../extension/type.ts";
import { dispatch } from "../util/event.ts";

export type Params = {
  readonly previewers: readonly Previewer[];
};

export class ItemPreviewer implements Disposable {
  readonly #previewers: readonly Previewer[];

  #controller = new AbortController();
  #processing = false;
  #preview: Preview | void = undefined;
  #previous?: {
    item: PreviewerItem;
    index: number;
  };
  #index: number = 0;

  constructor(params: Params) {
    this.#previewers = params.previewers;
  }

  get #previewer(): Previewer {
    return this.#previewers[this.#index];
  }

  get processing(): boolean {
    return this.#processing;
  }

  get preview(): Preview {
    return this.#preview ?? {
      content: [
        "No preview is available",
      ],
    };
  }

  get name(): string {
    return this.#previewer.name;
  }

  get index(): number {
    return this.#index;
  }

  set index(value: number) {
    if (value < 0) {
      this.#index = 0;
    } else if (value >= this.#previewers.length) {
      this.#index = this.#previewers.length - 1;
    } else {
      this.#index = value;
    }
  }

  async start(
    { item, width, height }: {
      readonly item: PreviewerItem | undefined;
      readonly width: number;
      readonly height: number;
    },
    options: { signal: AbortSignal },
  ): Promise<void> {
    if (!item) {
      this.#previous = undefined;
      this.#preview = {
        content: ["No preview item is available"],
      };
      return;
    }
    if (equal({ item, index: this.#index }, this.#previous)) {
      // Skip
      return;
    }
    this.#previous = {
      item,
      index: this.#index,
    };
    this.#abort(); // Cancel previous process
    const signal = AbortSignal.any([
      this.#controller.signal,
      options.signal,
    ]);
    this.#processing = true;
    try {
      this.#preview = await this.#previewer.preview({
        item,
        width,
        height,
      }, {
        signal,
      });
      this.#processing = false;
      dispatch("item-previewer-succeeded", undefined);
    } catch (err) {
      this.#processing = false;
      if (err instanceof DOMException && err.name === "AbortError") return;
      dispatch("item-previewer-failed", undefined);
      const m = err.message ?? err;
      console.warn(
        `[fall] Failed to preview item: ${m}`,
      );
    } finally {
      dispatch("item-previewer-completed", undefined);
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
