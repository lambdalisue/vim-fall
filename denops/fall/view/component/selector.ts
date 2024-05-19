import type { Denops } from "https://deno.land/x/denops_std@v6.4.0/mod.ts";
import type { Decoration as Decoration } from "https://deno.land/x/denops_std@v6.4.0/buffer/decoration.ts";
import { batch } from "https://deno.land/x/denops_std@v6.4.0/batch/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v6.4.0/function/mod.ts";
import * as buffer from "https://deno.land/x/denops_std@v6.4.0/buffer/mod.ts";

import type { Item, Renderer, RendererItem } from "../../extension/type.ts";
import { calcScrollOffset } from "../util/scrolloffset.ts";
import { isDefined } from "../../util/collection.ts";

export type Context = Readonly<{
  items: readonly Item[];
  index: number;
  selected: Set<unknown>;
}>;

export type Params = Readonly<{
  scrolloff: number;
  winwidth: number;
  winheight: number;
  renderers: readonly Renderer[];
}>;

/**
 * Selector component that shows processed items to select
 */
export class SelectorComponent implements Disposable {
  #bufnr: number;
  #scrolloff: number;
  #winwidth: number;
  #winheight: number;
  #renderers: readonly Renderer[];

  #offset: number = 0;

  constructor(
    bufnr: number,
    _winid: number,
    params: Params,
  ) {
    this.#bufnr = bufnr;
    this.#scrolloff = params.scrolloff;
    this.#winwidth = params.winwidth;
    this.#winheight = params.winheight;
    this.#renderers = params.renderers;
  }

  async render(
    denops: Denops,
    { items, index, selected }: Context,
    { signal }: { signal: AbortSignal },
  ): Promise<void> {
    try {
      this.#offset = calcScrollOffset(
        this.#offset,
        index,
        items.length,
        this.#winheight,
        this.#scrolloff,
      );

      const visibleItems = items.slice(
        this.#offset,
        this.#offset + this.#winheight,
      );
      const indexMap = new Map(visibleItems.map((v, i) => [v.id, i]));
      const selectedIndices = [...selected.values()]
        .map((id) => indexMap.get(id))
        .filter(isDefined);

      const rendererItems = await applyRenderers(
        visibleItems,
        this.#renderers,
        { width: this.#winwidth },
        { signal },
      );
      signal.throwIfAborted();

      const content = rendererItems.map((v) => v.label ?? v.value);
      const decorations = rendererItems.reduce((acc, v, i) => {
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
            {
              lnum: Math.max(0, index - this.#offset) + 1,
            },
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

async function applyRenderers(
  items: readonly RendererItem[],
  renderers: readonly Renderer[],
  params: { width: number },
  { signal }: { signal: AbortSignal },
): Promise<readonly RendererItem[]> {
  const size = items.length;
  if (size === 0) return [];
  for (const renderer of renderers) {
    try {
      const newItems = await renderer.render({ items, ...params }, { signal });
      signal.throwIfAborted();

      if (newItems.length !== size) {
        console.warn(
          `[fall] Renderer ${renderer.name} returned different size of items. Ignore.`,
        );
        continue;
      }
      items = newItems;
    } catch (err) {
      const m = err.message ?? err;
      console.warn(`[fall] Failed to apply renderer ${renderer.name}: ${m}`);
    }
  }
  return items;
}
