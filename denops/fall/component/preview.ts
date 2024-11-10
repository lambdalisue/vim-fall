import type { Denops } from "jsr:@denops/std@^7.3.0";
import * as fn from "jsr:@denops/std@^7.3.0/function";
import * as buffer from "jsr:@denops/std@^7.3.0/buffer";
import { batch } from "jsr:@denops/std@^7.3.0/batch";
import type { PreviewItem } from "jsr:@vim-fall/std@^0.2.0/item";
import type { Dimension } from "jsr:@vim-fall/std@^0.2.0/coordinator";

import { BaseComponent, type ComponentProperties } from "./_component.ts";

export type PreviewComponentParams = ComponentProperties & {
  realHighlight?: boolean;
};

export class PreviewComponent extends BaseComponent {
  #realHighlight: boolean;
  #item?: PreviewItem;
  #modifiedContent = true;
  #reservedCommands: string[] = [];

  constructor({ realHighlight, ...params }: PreviewComponentParams = {}) {
    super(params);
    this.#realHighlight = realHighlight ?? false;
  }

  get item(): PreviewItem | undefined {
    return this.#item;
  }

  set item(value: PreviewItem | undefined) {
    this.#item = value;
    this.#modifiedContent = true;
  }

  execute(command: string): void {
    this.#reservedCommands.push(command);
  }

  forceRender(): void {
    this.#modifiedContent = true;
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
    await fn.win_execute(denops, winid, "setlocal signcolumn=no nofoldenable");
    this.forceRender();
    return stack.move();
  }

  override async render(
    denops: Denops,
    { signal }: { signal?: AbortSignal } = {},
  ): Promise<true | void> {
    try {
      const results = [
        await this.#renderContent(denops, { signal }),
        await this.#executeCommands(denops, { signal }),
      ];
      return results.some((result) => result) ? true : undefined;
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      const m = err instanceof Error ? err.message : String(err);
      console.warn(`Failed to render content of the preview component: ${m}`);
    }
  }

  async #renderContent(
    denops: Denops,
    { signal }: { signal?: AbortSignal } = {},
  ): Promise<true | void> {
    if (!this.#modifiedContent || !this.info) return;
    this.#modifiedContent = false;

    const { winid, bufnr } = this.info;

    const {
      content,
      filename = "noname",
      filetype = "",
      line = 1,
      column = 1,
    } = this.#item ?? { content: ["No preview"] };

    signal?.throwIfAborted();
    await buffer.replace(denops, bufnr, content);

    signal?.throwIfAborted();
    await batch(denops, async (denops) => {
      // Clear previous buffer context
      await fn.win_execute(
        denops,
        winid,
        `silent! 0file`,
      );
      await fn.win_execute(
        denops,
        winid,
        `silent! syntax clear`,
      );
      // Change buffer name and reset options
      await fn.win_execute(
        denops,
        winid,
        `silent! file fall://preview/${filename}`,
      );
      await fn.win_execute(
        denops,
        winid,
        `silent! setlocal winfixbuf winfixwidth winfixheight`,
      );
      // Apply highlight
      if (this.#realHighlight) {
        await fn.win_execute(
          denops,
          winid,
          `call fall#internal#highlight#real('${filetype}')`,
        );
      } else {
        await fn.win_execute(
          denops,
          winid,
          `call fall#internal#highlight#fast('${filetype}')`,
        );
      }
      // Overwrite buffer local options may configured by ftplugin
      await fn.win_execute(
        denops,
        winid,
        `silent! setlocal buftype=nofile bufhidden=wipe nobuflisted noswapfile nomodifiable nowrap cursorline`,
      );
      // Move cursor
      await fn.win_execute(
        denops,
        winid,
        `silent! normal! ${line}G${column}|`,
      );
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
