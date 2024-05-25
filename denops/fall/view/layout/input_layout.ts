import type { Denops } from "https://deno.land/x/denops_std@v6.4.0/mod.ts";
import {
  batch,
  collect,
} from "https://deno.land/x/denops_std@v6.4.0/batch/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v6.4.0/function/mod.ts";
import * as opt from "https://deno.land/x/denops_std@v6.4.0/option/mod.ts";
import * as popup from "https://deno.land/x/denops_std@v6.4.0/popup/mod.ts";
import { is, type Predicate } from "jsr:@core/unknownutil@3.18.0";

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
  isBorder,
} from "./border.ts";
import { calcProperSize } from "./util.ts";

export type LayoutParams = {
  title?: string;
  width?: number;
  widthRatio: number;
  widthMin: number;
  widthMax: number;
  border?: Border;
  zindex?: number;
};

export const isLayoutParams = is.ObjectOf({
  title: is.OptionalOf(is.String),
  width: is.OptionalOf(is.Number),
  widthRatio: is.Number,
  widthMin: is.Number,
  widthMax: is.Number,
  border: is.OptionalOf(isBorder),
  zindex: is.OptionalOf(is.Number),
}) satisfies Predicate<LayoutParams>;

export interface Layout extends AsyncDisposable {
  input: popup.PopupWindow;
}

/**
 * Input
 *
 * ```
 *          width
 * ┌──────────────────────┐
 *
 * ╭──────────────────────╮  ┐
 * │        Input         │  │ height
 * ╰──────────────────────╯  ┘
 * ```
 */
export async function buildLayout(
  denops: Denops,
  params: LayoutParams,
): Promise<Layout> {
  await using stack = new AsyncDisposableStack();
  stack.defer(() => denops.redraw());

  const [screenWidth, screenHeight] = await collect(
    denops,
    (denops) => [
      opt.columns.get(denops),
      opt.lines.get(denops),
    ],
  );
  const width = params.width ??
    calcProperSize(
      screenWidth,
      params.widthRatio,
      params.widthMin,
      params.widthMax,
    );
  const height = 3;
  const x = Math.floor((screenWidth - width) / 2);
  const y = Math.floor((screenHeight - height) / 2);

  const border = params.border
    ? getBorder(params.border)
    : await getDefaultBorder(denops);

  const input = stack.use(
    await popup.open(denops, {
      title: params.title,
      relative: "editor",
      anchor: "NW",
      width: width - 2, // -2 for border
      height: height - 2, // -2 for border
      row: y,
      col: x,
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
      zindex: params.zindex,
      noRedraw: true,
    }),
  );

  // NOTE:
  // Using `setbufvar` on popup window doesn't work well on Vim.
  // That's why we use win_execute instead even for buffer-local settings.
  await batch(denops, async (denops) => {
    await fn.bufload(denops, input.bufnr);
    await fn.win_execute(
      denops,
      input.winid,
      "setlocal filetype=fall-input",
    );

    await denops.redraw();
  });

  const successStack = stack.move();
  return {
    input,
    [Symbol.asyncDispose]: () => successStack.disposeAsync(),
  };
}
