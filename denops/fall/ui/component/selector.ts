import type { Denops } from "https://deno.land/x/denops_std@v6.3.0/mod.ts";
import type { Decoration as Decoration } from "https://deno.land/x/denops_std@v6.3.0/buffer/decoration.ts";
import {
  batch,
  collect,
} from "https://deno.land/x/denops_std@v6.3.0/batch/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v6.3.0/function/mod.ts";
import * as opt from "https://deno.land/x/denops_std@v6.3.0/option/mod.ts";
import * as buffer from "https://deno.land/x/denops_std@v6.3.0/buffer/mod.ts";
import { equal } from "https://deno.land/std@0.203.0/assert/equal.ts";

import { calcScrollOffset } from "../../util/scrolloffset.ts";

export type LineDecoration = Omit<Decoration, "line">;

export interface Candidate {
  id: string;
  value: string;
  decorations?: LineDecoration[];
}

export class SelectorComponent {
  #bufnr: number;
  #winid: number;
  #selectable: boolean;
  #offset: number = 0;

  #changed: boolean = false;
  #index: number = 0;
  #selected: string[] = [];
  #candidates: Candidate[] = [];

  constructor(
    bufnr: number,
    winid: number,
    { selectable }: { selectable: boolean },
  ) {
    this.#bufnr = bufnr;
    this.#winid = winid;
    this.#selectable = selectable;
  }

  get offset(): number {
    return this.#offset;
  }

  get index(): number {
    return this.#index;
  }

  set index(value: number) {
    value = Math.min(this.#candidates.length - 1, Math.max(0, value));
    const changed = this.#index !== value;
    this.#changed = this.#changed || changed;
    this.#index = value;
  }

  get selected(): string[] {
    return this.#selected;
  }

  set selected(value: string[]) {
    if (!this.#selectable) {
      throw new Error("Selector is not configured as selectable");
    }
    const changed = !equal(this.#selected, value);
    this.#changed = this.#changed || changed;
    this.#selected = value;
  }

  get candidates(): Candidate[] {
    return this.#candidates;
  }

  set candidates(value: Candidate[]) {
    const changed = !equal(this.#candidates, value);
    this.#changed = this.#changed || changed;
    this.#candidates = value;
    this.index = this.#index; // Normalize index
  }

  async render(
    denops: Denops,
    { signal: _signal }: { signal: AbortSignal },
  ): Promise<boolean> {
    if (!this.#changed) return false;
    this.#changed = false;

    // Calculate scroll offset
    const [scrolloff, winheight] = await collect(denops, (denops) => [
      opt.scrolloff.get(denops),
      fn.winheight(denops, this.#winid),
    ]);
    this.#offset = calcScrollOffset(
      this.#offset,
      this.#index,
      this.#candidates.length,
      winheight,
      scrolloff,
    );

    // Build UI content
    const candidates = this.#candidates.slice(
      this.#offset,
      this.#offset + winheight,
    );
    const content = candidates.map((v) => v.value);
    const decorations = candidates.reduce((acc, v, i) => {
      if (!v.decorations) {
        return acc;
      }
      const line = i + 1;
      return acc.concat(
        v.decorations.map((d) => ({
          ...d,
          line,
        })),
      );
    }, [] as Decoration[]);

    const indexMap = new Map(candidates.map((v, i) => [v.id, i]));
    const selected = this.#selected
      .map((id) => indexMap.get(id))
      .filter(isDefined);

    // Render UI
    await buffer.replace(denops, this.#bufnr, content);
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
              lnum: Math.max(0, index - this.#offset) + 1,
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
      await buffer.decorate(denops, this.#bufnr, decorations);
    }
    return true;
  }
}

function isDefined<T>(v: T | undefined): v is T {
  return v !== undefined;
}
