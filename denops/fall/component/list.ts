import type { Denops } from "jsr:@denops/std@^7.3.2";
import type { Decoration } from "jsr:@denops/std@^7.3.2/buffer";
import { batch } from "jsr:@denops/std@^7.3.2/batch";
import * as fn from "jsr:@denops/std@^7.3.2/function";
import * as buffer from "jsr:@denops/std@^7.3.2/buffer";
import type { DetailUnit, DisplayItem } from "jsr:@vim-fall/std@^0.4.0/item";
import type { Dimension } from "jsr:@vim-fall/std@^0.4.0/coordinator";

import { BaseComponent } from "./_component.ts";

export const HIGHLIGHT_MATCH = "FallListMatch";
export const SIGN_GROUP_SELECTED = "PopUpFallListSelected";
export const SIGN_SELECTED = "FallListSelected";

export class ListComponent extends BaseComponent {
  #scroll = 1;
  #items: readonly DisplayItem<DetailUnit>[] = [];
  #selection = new Set<unknown>();
  #modifiedContent = true;
  #modifiedSigns = true;
  #reservedCommands: string[] = [];

  get scroll(): number {
    return this.#scroll;
  }

  get items(): readonly DisplayItem<DetailUnit>[] {
    return this.#items;
  }

  set items(items: DisplayItem<DetailUnit>[]) {
    this.#items = items;
    this.#modifiedContent = true;
    this.#modifiedSigns = true;
  }

  get selection(): Set<unknown> {
    return this.#selection;
  }

  set selection(selection: Set<unknown>) {
    this.#selection = selection;
    this.#modifiedSigns = true;
  }

  execute(command: string): void {
    this.#reservedCommands.push(command);
  }

  forceRender(): void {
    this.#modifiedContent = true;
    this.#modifiedSigns = true;
  }

  override async open(
    denops: Denops,
    dimension: Readonly<Dimension>,
    { signal }: { signal?: AbortSignal } = {},
  ): Promise<AsyncDisposable> {
    await using stack = new AsyncDisposableStack();
    stack.use(await super.open(denops, dimension, { signal }));
    const { winid } = this.info!;

    signal?.throwIfAborted();
    await fn.win_execute(
      denops,
      winid,
      "setlocal cursorline signcolumn=yes nowrap nofoldenable nonumber norelativenumber filetype=fall-list",
    );

    signal?.throwIfAborted();
    this.#scroll = await fn.getwinvar(denops, winid, "&scroll") as number;
    this.forceRender();
    return stack.move();
  }

  override async move(
    denops: Denops,
    dimension: Dimension,
    { signal }: { signal?: AbortSignal } = {},
  ): Promise<void> {
    await super.move(denops, dimension, { signal });
    const { winid } = this.info!;

    // 'scroll' changes its default value by window height
    signal?.throwIfAborted();
    this.#scroll = await fn.getwinvar(denops, winid, "&scroll") as number;
  }

  override async render(
    denops: Denops,
    { signal }: { signal?: AbortSignal } = {},
  ): Promise<true | void> {
    try {
      const results = [
        await this.#renderContent(denops, { signal }),
        await this.#placeSigns(denops, { signal }),
        await this.#executeCommands(denops, { signal }),
      ];
      return results.some((result) => result) ? true : undefined;
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      const m = err instanceof Error ? err.message : String(err);
      console.warn(`Failed to render content of the list component: ${m}`);
    }
  }

  async #renderContent(
    denops: Denops,
    { signal }: { signal?: AbortSignal } = {},
  ): Promise<true | void> {
    if (!this.#modifiedContent || !this.info) return;
    this.#modifiedContent = false;

    const { bufnr, dimension: { width } } = this.info;
    const content = this.#items.map((v) => v.label);
    const decorations = this.#items
      .reduce((acc, v, i) => {
        const decorations = v.decorations
          .filter((d) => d.column < width)
          .map((d) => ({
            highlight: HIGHLIGHT_MATCH,
            ...d,
            line: i + 1,
          }));
        acc.push(...decorations);
        return acc;
      }, [] as Decoration[]);

    signal?.throwIfAborted();
    await buffer.replace(denops, bufnr, content);
    signal?.throwIfAborted();
    await buffer.undecorate(denops, bufnr);
    signal?.throwIfAborted();
    await buffer.decorate(denops, bufnr, decorations);

    return true;
  }

  async #placeSigns(
    denops: Denops,
    { signal }: { signal?: AbortSignal } = {},
  ): Promise<true | void> {
    if (!this.#modifiedSigns || !this.info) return;
    this.#modifiedSigns = false;

    const { bufnr } = this.info;
    const selects = this.#items
      .map((v, i) => [v.id, i] as const)
      .filter(([id, _]) => id != null && this.#selection.has(id))
      .map(([_, i]) => i);

    signal?.throwIfAborted();
    await batch(denops, async (denops) => {
      // NOTE:
      // Vim require 'PopUp' prefix for sign group name in popup window
      await fn.sign_unplace(denops, SIGN_GROUP_SELECTED, {
        buffer: bufnr,
      });
      for (const i of selects) {
        await fn.sign_place(
          denops,
          0,
          SIGN_GROUP_SELECTED,
          SIGN_SELECTED,
          bufnr,
          { lnum: Math.max(1, i + 1) },
        );
      }
    });

    return true;
  }

  async #executeCommands(
    denops: Denops,
    { signal }: { signal?: AbortSignal } = {},
  ): Promise<true | void> {
    if (!this.#reservedCommands.length || !this.info) return;
    const reservedCommands = this.#reservedCommands;
    this.#reservedCommands = [];

    const { winid } = this.info;

    signal?.throwIfAborted();
    await batch(denops, async (denops) => {
      for (const command of reservedCommands) {
        await fn.win_execute(denops, winid, command);
      }
    });

    return true;
  }
}
