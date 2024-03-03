import type { Denops } from "https://deno.land/x/denops_std@v6.3.0/mod.ts";
import {
  batch,
  collect,
} from "https://deno.land/x/denops_std@v6.3.0/batch/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v6.3.0/function/mod.ts";
import * as opt from "https://deno.land/x/denops_std@v6.3.0/option/mod.ts";
import * as popup from "https://deno.land/x/denops_std@v6.3.0/popup/mod.ts";
import {
  is,
  type PredicateType,
} from "https://deno.land/x/unknownutil@v3.16.3/mod.ts";

import {
  BORDER_B,
  BORDER_BL,
  BORDER_BR,
  BORDER_L,
  BORDER_LSEP,
  BORDER_R,
  BORDER_RSEP,
  BORDER_SEP,
  BORDER_T,
  BORDER_TL,
  BORDER_TR,
  getBorder,
  getDefaultBorder,
  isBorder,
} from "./border.ts";
import { calcProperSize } from "./util.ts";

export const isLayoutParams = is.ObjectOf({
  width: is.OptionalOf(is.Number),
  widthRatio: is.Number,
  widthMin: is.Number,
  widthMax: is.Number,
  height: is.OptionalOf(is.Number),
  heightRatio: is.Number,
  heightMin: is.Number,
  heightMax: is.Number,
  previewWidth: is.OptionalOf(is.Number),
  previewWidthRatio: is.Number,
  previewWidthMin: is.Number,
  previewWidthMax: is.Number,
  border: is.OptionalOf(isBorder),
  zindex: is.OptionalOf(is.Number),
});

export type LayoutParams = PredicateType<typeof isLayoutParams>;

export interface Layout {
  prompt: popup.PopupWindow;
  selector: popup.PopupWindow;
  preview: popup.PopupWindow;
  dispose: (denops: Denops) => Promise<void>;
}

/**
 * Prompt head / Preview right layout
 *
 * ```
 *                 width
 * ┌─────────────────────────────────────┐
 *
 * ╭──────────────────────╮╭─────────────╮  ┐
 * │        Prompt        ││             │  │
 * │----------------------││             │  │
 * │                      ││   Preview   │  │height
 * │        Result        ││             │  │
 * │                      ││             │  │
 * ╰──────────────────────╯╰─────────────╯  ┘
 *
 * └──────────────────────┘└─────────────┘
 *        mainWidth         previewWidth
 * ```
 */
export async function buildLayout(
  denops: Denops,
  params: LayoutParams,
): Promise<Layout> {
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
  const height = params.height ??
    calcProperSize(
      screenHeight,
      params.heightRatio,
      params.heightMin,
      params.heightMax,
    );
  const x = Math.floor((screenWidth - width) / 2);
  const y = Math.floor((screenHeight - height) / 2);

  const previewWidth = params.previewWidth ?? calcProperSize(
    width,
    params.previewWidthRatio,
    params.previewWidthMin,
    params.previewWidthMax,
  );
  const mainWidth = width - previewWidth;

  const border = params.border
    ? getBorder(params.border)
    : await getDefaultBorder(denops);

  const prompt = await popup.open(denops, {
    relative: "editor",
    anchor: "NW",
    width: mainWidth - 2, // -2 for border
    height: 1,
    row: y,
    col: x,
    border: [
      border[BORDER_TL],
      border[BORDER_T],
      border[BORDER_TR],
      border[BORDER_R],
      border[BORDER_RSEP],
      border[BORDER_SEP],
      border[BORDER_LSEP],
      border[BORDER_L],
    ],
    highlight: {
      normal: "FallNormal",
      border: "FallBorder",
    },
    zindex: params.zindex,
    noRedraw: true,
  });

  const selector = await popup.open(denops, {
    relative: "editor",
    anchor: "NW",
    width: mainWidth - 2, // -2 for border
    height: height - 1 - 3, // -1 for prompt, -3 for border
    row: y + 3, // +3 for prompt and border
    col: x,
    border: [
      "",
      "",
      "",
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
  });

  const preview = await popup.open(denops, {
    relative: "editor",
    anchor: "NW",
    width: previewWidth - 2, // -2 for border
    height: height - 2, // -2 for border
    row: y,
    col: x + mainWidth,
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
  });

  try {
    // NOTE:
    // Using `setbufvar` on popup window doesn't work well on Vim.
    // That's why we use win_execute instead even for buffer-local settings.
    await batch(denops, async (denops) => {
      await fn.bufload(denops, prompt.bufnr);
      await fn.win_execute(
        denops,
        prompt.winid,
        "setlocal filetype=fall-prompt",
      );

      await fn.bufload(denops, selector.bufnr);
      await fn.win_execute(
        denops,
        selector.winid,
        "setlocal filetype=fall-selector",
      );

      await fn.bufload(denops, preview.bufnr);
      await fn.win_execute(
        denops,
        preview.winid,
        "setlocal nowrap nofoldenable signcolumn=no",
      );

      await denops.redraw();
    });

    const dispose = async (denops: Denops) => {
      await batch(denops, async (denops) => {
        await prompt.close();
        await selector.close();
        await preview.close();
        await denops.redraw();
      });
    };

    return { prompt, selector, preview, dispose };
  } catch (err) {
    await batch(denops, async (denops) => {
      await prompt.close();
      await selector.close();
      await preview.close();
      await denops.redraw();
    });
    throw err;
  }
}
