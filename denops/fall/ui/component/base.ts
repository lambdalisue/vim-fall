import type { Denops } from "https://deno.land/x/denops_std@v6.4.0/mod.ts";
import { batch } from "https://deno.land/x/denops_std@v6.4.0/batch/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v6.4.0/function/mod.ts";
import * as popup from "https://deno.land/x/denops_std@v6.4.0/popup/mod.ts";
import { g } from "https://deno.land/x/denops_std@v6.4.0/variable/mod.ts";

import {
  type Border,
  BORDER_B,
  BORDER_BL,
  BORDER_BR,
  BORDER_L,
  BORDER_R,
  BORDER_T,
  BORDER_TL,
  BORDER_TR,
  getBorder,
  getDefaultBorder,
} from "../util/border.ts";
import { type Divider } from "../util/divider.ts";

export type Layout = {
  readonly width: number;
  readonly height: number;
  readonly col: number;
  readonly row: number;
};

export type Options = {
  readonly title?: string;
  readonly border?: Border;
  readonly divider?: Divider;
  readonly zindex?: number;
};

export type Component = {
  open(
    denops: Denops,
    layout: Layout,
    options: Options,
  ): Promise<AsyncDisposable>;
  move(denops: Denops, layout: Layout): Promise<void>;
  render(
    denops: Denops,
    { signal }: { signal?: AbortSignal },
  ): Promise<void | true>;
};

export abstract class BaseComponent implements Component {
  protected abstract readonly name: string;

  #window?: popup.PopupWindow;

  get window(): popup.PopupWindow | undefined {
    return this.#window;
  }

  async open(
    denops: Denops,
    layout: Layout,
    options: Options,
  ): Promise<AsyncDisposable> {
    if (this.#window) {
      throw new Error("The component is already opened");
    }
    await using stack = new AsyncDisposableStack();
    const border = getBorder(options.border ?? await getDefaultBorder(denops));
    const window = this.#window = stack.use(
      await popup.open(denops, {
        ...layout,
        title: options.title ? ` ${options.title} ` : undefined,
        relative: "editor",
        anchor: "NW",
        border: [
          border[BORDER_TL],
          border[BORDER_T],
          border[BORDER_TR],
          border[BORDER_R],
          border[BORDER_BR],
          border[BORDER_B],
          border[BORDER_BL],
          border[BORDER_L],
        ],
        highlight: {
          normal: "FallNormal",
          border: "FallBorder",
        },
        zindex: options.zindex,
        noRedraw: true,
      }),
    );
    // NOTE:
    // Using `setbufvar` on popup window doesn't work well on Vim.
    // That's why we use win_execute instead even for buffer-local settings.
    await batch(denops, async (denops) => {
      await fn.bufload(denops, window.bufnr);
      await fn.win_execute(
        denops,
        window.winid,
        `setlocal filetype=fall-${this.name}`,
      );
      await g.set(
        denops,
        `_fall_component_${this.name}_winid`,
        window.winid,
      );
      await denops.redraw();
    });
    const successStack = stack.move();
    return {
      [Symbol.asyncDispose]: async () => {
        await successStack.disposeAsync();
        this.#window = undefined;
      },
    };
  }

  async move(denops: Denops, layout: Layout): Promise<void> {
    if (!this.#window) {
      throw new Error("The component is not opened");
    }
    await popup.config(denops, this.#window.winid, {
      ...layout,
      relative: "editor",
      noRedraw: true,
    });
  }

  abstract render(
    denops: Denops,
    { signal }: { signal: AbortSignal },
  ): Promise<void | true>;
}
