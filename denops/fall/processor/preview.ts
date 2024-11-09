import type { Denops } from "jsr:@denops/std@^7.3.0";
import type { PreviewItem } from "jsr:@vim-fall/std@^0.1.0-pre.0/item";
import type {
  Previewer,
  PreviewParams,
} from "jsr:@vim-fall/std@^0.1.0-pre.0/previewer";

import { dispatch } from "../event.ts";

export class PreviewProcessor<T> {
  #previewer?: Previewer<T>;
  #controller: AbortController = new AbortController();
  #processing?: Promise<void>;
  #reserved?: () => void;
  #item: PreviewItem | undefined = undefined;

  constructor(previewer: Previewer<T> | undefined) {
    this.#previewer = previewer;
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
