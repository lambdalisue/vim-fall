import type { Denops } from "https://deno.land/x/denops_std@v6.4.0/mod.ts";
import type { Decoration as Decoration } from "https://deno.land/x/denops_std@v6.4.0/buffer/decoration.ts";
import { batch } from "https://deno.land/x/denops_std@v6.4.0/batch/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v6.4.0/function/mod.ts";
import * as buffer from "https://deno.land/x/denops_std@v6.4.0/buffer/mod.ts";

import type { RendererItem } from "../../extension/type.ts";
import { isDefined } from "../../util/collection.ts";

/**
 * Selector component that shows processed items to select
 */
export class SelectorComponent implements Disposable {
  readonly #bufnr: number;

  constructor(
    bufnr: number,
    _winid: number,
  ) {
    this.#bufnr = bufnr;
  }

  async render(
    denops: Denops,
    { items, line, selected }: {
      readonly items: readonly RendererItem[];
      readonly line: number;
      readonly selected: Set<unknown>;
    },
    { signal }: { readonly signal: AbortSignal },
  ): Promise<void> {
    try {
      const indexMap = new Map(items.map((v, i) => [v.id, i]));
      const selectedIndices = [...selected.values()]
        .map((id) => indexMap.get(id))
        .filter(isDefined);

      const content = items.map((v) => v.label ?? v.value);
      const decorations = items.reduce((acc, v, i) => {
        if (!v.decorations) {
          return acc;
        }
        const line = i + 1;
        return acc.concat(
          v.decorations.map((d) => ({
            highlight: "FallPickerMatch",
            ...d,
            line,
          })),
        );
      }, [] as Decoration[]);

      await buffer.replace(denops, this.#bufnr, content);
      signal.throwIfAborted();

      if (content.length > 0) {
        await batch(denops, async (denops) => {
          // NOTE:
          // Vim require 'PopUp' prefix for sign group name in popup window
          await fn.sign_unplace(denops, "PopUpFallSelector", {
            buffer: this.#bufnr,
          });
          for (const index of selectedIndices) {
            await fn.sign_place(
              denops,
              0,
              "PopUpFallSelector",
              "FallSelectorSelected",
              this.#bufnr,
              {
                lnum: Math.max(0, index) + 1,
              },
            );
          }
          await fn.sign_place(
            denops,
            0,
            "PopUpFallSelector",
            "FallSelectorCursor",
            this.#bufnr,
            { lnum: line },
          );
        });
        signal.throwIfAborted();

        await buffer.decorate(denops, this.#bufnr, decorations);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      const m = err.message ?? err;
      console.warn(`Failed to render the selector component: ${m}`);
    }
  }

  [Symbol.dispose]() {
    // Do nothing
  }
}
