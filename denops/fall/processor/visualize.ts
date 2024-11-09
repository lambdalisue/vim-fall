import type { Denops } from "jsr:@denops/std@^7.3.0";
import type { DisplayItem, IdItem } from "jsr:@vim-fall/std@^0.1.0-pre.0/item";
import type { Renderer } from "jsr:@vim-fall/std@^0.1.0-pre.0/renderer";
import type { Sorter } from "jsr:@vim-fall/std@^0.1.0-pre.0/sorter";

import { dispatch } from "../event.ts";
import { adjustOffset } from "../lib/adjust_offset.ts";

const HEIGHT = 10;
const SCROLL_OFFSET = 2;

export type VisualizeProcessorOptions = {
  height?: number;
  scrollOffset?: number;
};

export class VisualizeProcessor<T> {
  #sorter?: Sorter<T>;
  #renderer?: Renderer<T>;
  #height: number;
  #scrollOffset: number;
  #controller: AbortController = new AbortController();
  #processing?: Promise<void>;
  #reserved?: () => void;
  #items: DisplayItem<T>[] = [];
  #itemCount: number = 0;
  #cursor: number = 0;
  #offset: number = 0;

  constructor(
    sorter: Sorter<T> | undefined,
    renderer: Renderer<T> | undefined,
    options: VisualizeProcessorOptions = {},
  ) {
    this.#sorter = sorter;
    this.#renderer = renderer;
    this.#height = options.height ?? HEIGHT;
    this.#scrollOffset = options.scrollOffset ?? SCROLL_OFFSET;
  }

  get items() {
    return this.#items;
  }

  get line(): number {
    return this.#cursor - this.#offset + 1;
  }

  get cursor(): number {
    return this.#cursor;
  }

  set cursor(cursor: number | "$") {
    if (cursor === "$") {
      cursor = this.#itemCount - 1;
    }
    this.#adjustCursor(cursor);
    this.#adjustOffset();
  }

  #adjustCursor(cursor?: number): void {
    cursor = cursor ?? this.cursor;
    if (cursor < 0) {
      cursor = 0;
    } else if (cursor >= this.#itemCount) {
      cursor = this.#itemCount - 1;
    }
    this.#cursor = cursor;
  }

  get offset(): number {
    return this.#offset;
  }

  #adjustOffset(offset?: number): void {
    this.#offset = adjustOffset(
      offset ?? this.offset,
      this.cursor,
      this.#itemCount,
      this.#height,
      this.#scrollOffset,
    );
  }

  get height(): number {
    return this.#height;
  }

  set height(height: number) {
    this.#height = height;
    this.#adjustOffset();
  }

  get scrollOffset(): number {
    return this.#scrollOffset;
  }

  set scrollOffset(offset: number) {
    this.#scrollOffset = offset;
    this.#adjustOffset();
  }

  start(denops: Denops, { items }: { items: IdItem<T>[] }): void {
    if (this.#processing) {
      // Keep most recent start request for later.
      this.#reserved = () => this.start(denops, { items });
      return;
    }
    this.#processing = (async () => {
      dispatch({ type: "visualize-processor-started" });
      const signal = this.#controller.signal;

      this.#itemCount = items.length;
      this.#adjustCursor();
      this.#adjustOffset();

      await this.#sorter?.sort(
        denops,
        { items },
        { signal },
      );
      signal.throwIfAborted();

      const displayItems = items
        .slice(this.offset, this.offset + this.height)
        .map((v) => ({
          ...v,
          label: v.label ?? v.value,
          decorations: v.decorations ?? [],
        }));

      await this.#renderer?.render(
        denops,
        { items: displayItems },
        { signal },
      );
      signal.throwIfAborted();

      this.#items = displayItems;
      dispatch({ type: "visualize-processor-succeeded" });
    })();
    this.#processing
      .catch((err) => {
        dispatch({ type: "visualize-processor-failed", err });
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
