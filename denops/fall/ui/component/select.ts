import type { Denops } from "https://deno.land/x/denops_std@v6.4.0/mod.ts";
import { equal } from "jsr:@std/assert/equal";
import type { Decoration as Decoration } from "https://deno.land/x/denops_std@v6.4.0/buffer/decoration.ts";
import { batch } from "https://deno.land/x/denops_std@v6.4.0/batch/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v6.4.0/function/mod.ts";
import * as buffer from "https://deno.land/x/denops_std@v6.4.0/buffer/mod.ts";

import type { RendererItem } from "../../extension/mod.ts";
import { isDefined } from "../../util/collection.ts";
import { BaseComponent } from "./base.ts";

export class SelectComponent extends BaseComponent {
  protected readonly name = "select";

  #modified = false;
  #line = 1;
  #items: readonly RendererItem[] = [];
  #selected: Set<unknown> = new Set();

  get line(): number {
    return this.#line;
  }

  set line(value: number) {
    if (this.#line === value) return;
    this.#line = value;
    this.#modified = true;
  }

  get items(): readonly RendererItem[] {
    return this.#items;
  }

  set items(value: readonly RendererItem[]) {
    this.#items = value;
    this.#modified = true;
  }

  get selected(): Set<unknown> {
    return this.#selected;
  }

  set selected(value: Set<unknown>) {
    if (equal(this.#selected, value)) return;
    this.#selected = value;
    this.#modified = true;
  }

  async render(
    denops: Denops,
    { signal }: { signal: AbortSignal },
  ): Promise<void | true> {
    if (!this.window) {
      throw new Error("The component is not opened");
    }
    const { bufnr } = this.window;
    if (!this.#modified) {
      return true;
    }
    this.#modified = false;
    try {
      const indexMap = new Map(this.#items.map((v, i) => [v.id, i]));
      const selectedIndices = [...this.#selected.values()]
        .map((id) => indexMap.get(id))
        .filter(isDefined);

      const content = this.#items.map((v) => v.label ?? v.value);
      const decorations = this.#items.reduce((acc, v, i) => {
        if (!v.decorations) {
          return acc;
        }
        const line = i + 1;
        return acc.concat(
          v.decorations.map((d) => ({
            highlight: "FallSelectMatch",
            ...d,
            line,
          })),
        );
      }, [] as Decoration[]);

      await buffer.replace(denops, bufnr, content);
      signal.throwIfAborted();

      if (content.length > 0) {
        await batch(denops, async (denops) => {
          // NOTE:
          // Vim require 'PopUp' prefix for sign group name in popup window
          await fn.sign_unplace(denops, "PopUpFallSelect", {
            buffer: bufnr,
          });
          for (const index of selectedIndices) {
            await fn.sign_place(
              denops,
              0,
              "PopUpFallSelect",
              "FallSelectSelected",
              bufnr,
              {
                lnum: Math.max(0, index) + 1,
              },
            );
          }
          await fn.sign_place(
            denops,
            0,
            "PopUpFallSelect",
            "FallSelectCursor",
            bufnr,
            { lnum: this.#line },
          );
        });
        signal.throwIfAborted();

        await buffer.decorate(denops, bufnr, decorations);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      const m = err.message ?? err;
      console.warn(`Failed to render the select window: ${m}`);
    }
  }
}
