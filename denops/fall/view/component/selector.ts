import type { Denops } from "https://deno.land/x/denops_std@v6.4.0/mod.ts";
import type { Decoration as Decoration } from "https://deno.land/x/denops_std@v6.4.0/buffer/decoration.ts";
import { batch } from "https://deno.land/x/denops_std@v6.4.0/batch/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v6.4.0/function/mod.ts";
import * as buffer from "https://deno.land/x/denops_std@v6.4.0/buffer/mod.ts";
import type {
  Item,
  Renderer,
  RendererItem,
} from "https://deno.land/x/fall_core@v0.8.0/mod.ts";
import { equal } from "jsr:@std/assert@0.225.1/equal";

import { calcScrollOffset } from "../util/scrolloffset.ts";
import { isDefined } from "../../util/collection.ts";

export interface SelectorComponentParams {
  scrolloff: number;
  winwidth: number;
  winheight: number;
  renderers: Renderer[];
}

/**
 * A component that renders a selector buffer.
 */
export class SelectorComponent {
  #bufnr: number;
  #scrolloff: number;
  #winwidth: number;
  #winheight: number;
  #renderers: Renderer[];

  #offset: number = 0;

  #changed: boolean = false;
  #index: number = 0;
  #selected: Set<unknown> = new Set();
  #items: Item[] = [];

  constructor(
    bufnr: number,
    _winid: number,
    params: SelectorComponentParams,
  ) {
    this.#bufnr = bufnr;
    this.#scrolloff = params.scrolloff;
    this.#winwidth = params.winwidth;
    this.#winheight = params.winheight;
    this.#renderers = params.renderers;
  }

  /**
   * Set the index of the selected item.
   *
   * It will be normalized to the valid range.
   */
  set index(value: number) {
    value = Math.min(this.#items.length - 1, Math.max(0, value));
    const changed = this.#index !== value;
    this.#changed = this.#changed || changed;
    this.#index = value;
  }

  /**
   * Set the selected items.
   *
   * The value is a set of the value of item's `id` field.
   */
  set selected(value: Set<unknown>) {
    const changed = !equal(this.#selected, value);
    this.#changed = this.#changed || changed;
    this.#selected = value;
  }

  /**
   * Set the items to be rendered.
   */
  set items(value: Item[]) {
    const changed = !equal(this.#items, value);
    this.#changed = this.#changed || changed;
    this.#items = value;
    this.index = this.#index; // Normalize index
  }

  /**
   * Render the selector buffer.
   *
   * It returns true if the selector buffer is rendered.
   */
  async render(
    denops: Denops,
    { signal }: { signal: AbortSignal },
  ): Promise<boolean> {
    if (!this.#changed) return false;
    this.#changed = false;

    // Calculate scroll offset
    this.#offset = calcScrollOffset(
      this.#offset,
      this.#index,
      this.#items.length,
      this.#winheight,
      this.#scrolloff,
    );

    // Build UI content
    const items = this.#items.slice(
      this.#offset,
      this.#offset + this.#winheight,
    );
    const indexMap = new Map(items.map((v, i) => [v.id, i]));
    const selected = [...this.#selected.values()]
      .map((id) => indexMap.get(id))
      .filter(isDefined);

    // Render UI
    try {
      const rendererItems = await applyRenderers(
        denops,
        items,
        this.#renderers,
        { width: this.#winwidth },
        { signal },
      );

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
      if (signal.aborted) return true;

      await buffer.replace(denops, this.#bufnr, content);
      if (signal.aborted) return true;

      if (content.length > 0) {
        await batch(denops, async (denops) => {
          // NOTE:
          // Vim require 'PopUp' prefix for sign group name in popup window
          await fn.sign_unplace(denops, "PopUpFallSelector", {
            buffer: this.#bufnr,
          });
          for (const index of selected) {
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
              lnum: Math.max(0, this.#index - this.#offset) + 1,
            },
          );
        });
        if (signal.aborted) return true;

        await buffer.decorate(denops, this.#bufnr, decorations);
      }
    } catch (err) {
      // Fail silently
      console.debug(
        `[fall] Failed to render content to the selector buffer: ${err}`,
      );
    }
    return true;
  }
}

/**
 * Apply renderers to the items.
 *
 * It ignore the result of the renderer if the renderer returns different size of items.
 */
async function applyRenderers(
  denops: Denops,
  items: RendererItem[],
  renderers: Renderer[],
  params: { width: number },
  { signal }: { signal: AbortSignal },
): Promise<RendererItem[]> {
  const size = items.length;
  if (size === 0) return [];
  for (
    const [index, renderer] of renderers.map((v, index) => [index, v] as const)
  ) {
    try {
      const newItems = await renderer.render(denops, items, params, { signal });
      if (newItems.length !== size) {
        console.warn(
          `[fall] Renderer ${index} returned different size of items. Ignore.`,
        );
        continue;
      }
      items = newItems;
    } catch (err) {
      // Fail silently
      console.debug(`[fall] Failed to apply renderer ${index}: ${err}`);
    }
  }
  return items;
}
