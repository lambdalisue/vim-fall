import {
  BorderIndex as BI,
  DividerIndex as DI,
  type Theme,
} from "../../theme.ts";
import type { Coordinator, Layout, Size, Style } from "../../coordinator.ts";

const WIDTH_RATIO = 0.8;
const WIDTH_MIN = 10;
const WIDTH_MAX = 340;
const HEIGHT_RATIO = 0.6;
const HEIGHT_MIN = 5;
const HEIGHT_MAX = 70;
const PREVIEW_RATIO = 0.6;

type Options = {
  hidePreview?: boolean;
  widthRatio?: number;
  widthMin?: number;
  widthMax?: number;
  heightRatio?: number;
  heightMin?: number;
  heightMax?: number;
  previewRatio?: number;
};

/**
 * Modern Coordinator.
 *
 * This coordinator is designed according to the author's preferences.
 * There is no space between the input and list components, but
 * the preview component is separated by a space.
 *
 * It looks like this (with MODERN_THEME):
 *
 * ```
 *                               Width
 *                ╭──────────────────────────────────╮
 *
 *             ╭─ ╭────────────╮╭────────────────────╮ ─╮
 * inputHeight │  │            ││                    │  │
 *             ├─ ├╌╌╌╌╌╌╌╌╌╌╌╌┤│                    │  │
 *             │  │            ││                    │  │
 *             │  │            ││                    │  │
 *             │  │            ││                    │  │
 *             │  │            ││                    │  │
 *             │  │            ││                    │  │Height
 * listHeight  │  │            ││                    │  │
 *             │  │            ││                    │  │
 *             │  │            ││                    │  │
 *             │  │            ││                    │  │
 *             │  │            ││                    │  │
 *             │  │            ││                    │  │
 *             ╰─ ╰────────────╯╰────────────────────╯ ─╯
 *                ╰────────────╯╰────────────────────╯
 *                  mainWidth        previewWidth
 * ```
 */
export function modern(options: Options = {}): Coordinator {
  const {
    hidePreview = false,
    widthRatio = WIDTH_RATIO,
    widthMin = WIDTH_MIN,
    widthMax = WIDTH_MAX,
    heightRatio = HEIGHT_RATIO,
    heightMin = HEIGHT_MIN,
    heightMax = HEIGHT_MAX,
    previewRatio = PREVIEW_RATIO,
  } = options;
  const dimension = ({ width: screenWidth, height: screenHeight }: Size) => {
    const width = Math.min(
      widthMax,
      Math.max(widthMin, Math.floor(screenWidth * widthRatio)),
    );
    const height = Math.min(
      heightMax,
      Math.max(heightMin, Math.floor(screenHeight * heightRatio)),
    );
    const col = Math.floor((screenWidth - width) / 2);
    const row = Math.floor((screenHeight - height) / 2);
    return { col, row, width, height };
  };
  if (!hidePreview) {
    return {
      style({ border, divider }: Theme): Style {
        return {
          input: [
            border[BI.TopLeft],
            border[BI.Top],
            border[BI.TopRight],
            border[BI.Right],
            "",
            "",
            "",
            border[BI.Left],
          ],
          list: [
            divider[DI.Left],
            divider[DI.Horizonal],
            divider[DI.Right],
            border[BI.Right],
            border[BI.BottomRight],
            border[BI.Bottom],
            border[BI.BottomLeft],
            border[BI.Left],
          ],
          preview: [
            border[BI.TopLeft],
            border[BI.Top],
            border[BI.TopRight],
            border[BI.Right],
            border[BI.BottomRight],
            border[BI.Bottom],
            border[BI.BottomLeft],
            border[BI.Left],
          ],
        } as const;
      },

      layout(screen: Size): Layout {
        const { col, row, width, height } = dimension(screen);
        const previewWidth = Math.max(0, Math.floor(width * previewRatio));
        const previewInnerWidth = previewWidth - 2;
        const mainWidth = width - previewWidth;
        const mainInnerWidth = mainWidth - 2;
        const inputHeight = 2;
        const inputInnerHeight = inputHeight - 1;
        const listHeight = height - inputHeight;
        const listInnerHeight = listHeight - 2;
        const previewInnerHeight = height - 2;
        return {
          input: {
            col,
            row,
            width: mainInnerWidth,
            height: inputInnerHeight,
          },
          list: {
            col,
            row: row + inputHeight,
            width: mainInnerWidth,
            height: listInnerHeight,
          },
          preview: {
            col: col + mainWidth,
            row,
            width: previewInnerWidth,
            height: previewInnerHeight,
          },
        } as const;
      },
    };
  } else {
    return {
      style({ border, divider }: Theme): Style {
        return {
          input: [
            border[BI.TopLeft],
            border[BI.Top],
            border[BI.TopRight],
            border[BI.Right],
            "",
            "",
            "",
            border[BI.Left],
          ],
          list: [
            divider[DI.Left],
            divider[DI.Horizonal],
            divider[DI.Right],
            border[BI.Right],
            border[BI.BottomRight],
            border[BI.Bottom],
            border[BI.BottomLeft],
            border[BI.Left],
          ],
        } as const;
      },

      layout(screen: Size): Layout {
        const { col, row, width, height } = dimension(screen);
        const mainInnerWidth = width - 2;
        const inputHeight = 2;
        const inputInnerHeight = inputHeight - 1;
        const listHeight = height - inputHeight;
        const listInnerHeight = listHeight - 2;
        return {
          input: {
            col,
            row,
            width: mainInnerWidth,
            height: inputInnerHeight,
          },
          list: {
            col,
            row: row + inputHeight,
            width: mainInnerWidth,
            height: listInnerHeight,
          },
        } as const;
      },
    };
  }
}
