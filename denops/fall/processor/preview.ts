import type { Denops } from "jsr:@denops/std@^7.3.2";
import type { Detail, PreviewItem } from "jsr:@vim-fall/std@^0.2.0/item";
import type {
  Previewer,
  PreviewParams,
} from "jsr:@vim-fall/std@^0.2.0/previewer";

import { dispatch } from "../event.ts";

export class PreviewProcessor<T extends Detail> {
  #previewers: Previewer<T>[];
  #controller: AbortController = new AbortController();
  #processing?: Promise<void>;
  #reserved?: () => void;
  #item: PreviewItem | undefined = undefined;
  #previewerIndex = 0;

  constructor(previewers: Previewer<T>[]) {
    this.#previewers = previewers;
  }

  get #previewer(): Previewer<T> | undefined {
    return this.#previewers[this.#previewerIndex];
  }

  get previewerCount(): number {
    return this.#previewers.length;
  }

  get previewerIndex(): number {
    return this.#previewerIndex;
  }

  set previewerIndex(index: number | "$") {
    if (index === "$" || index >= this.#previewers.length) {
      index = this.#previewers.length - 1;
    } else if (index < 0) {
      index = 0;
    }
    this.#previewerIndex = index;
  }

  get item(): PreviewItem | undefined {
    return this.#item;
  }

  start(denops: Denops, { item }: PreviewParams<T>): void {
    if (this.#processing) {
      // Keep most recent start request for later.
      this.#reserved = () => this.start(denops, { item });
      return;
    }
    this.#processing = (async () => {
      dispatch({ type: "preview-processor-started" });
      const signal = this.#controller.signal;
      if (!item) {
        this.#item = undefined;
        return;
      }

      const previewItem = await this.#previewer?.preview(
        denops,
        { item },
        { signal },
      );
      signal.throwIfAborted();

      this.#item = previewItem ?? undefined;
      dispatch({ type: "preview-processor-succeeded" });
    })();
    this.#processing
      .catch((err) => {
        dispatch({ type: "preview-processor-failed", err });
      })
      .finally(() => {
        this.#processing = undefined;
      })
      .then(() => {
        this.#reserved?.();
        this.#reserved = undefined;
      });
  }

  [Symbol.dispose]() {
    try {
      this.#controller.abort(null);
    } catch {
      // Ignore
    }
  }
}
