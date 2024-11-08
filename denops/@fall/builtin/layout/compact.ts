import {
  type Border,
  BorderIndex as BI,
  DividerIndex as DI,
  type Theme,
} from "../../theme.ts";
import type { Dimension, Layout, Size } from "../../layout.ts";

const WIDTH_RATIO = 0.8;
const WIDTH_MIN = 10;
const WIDTH_MAX = 340;
const HEIGHT_RATIO = 0.6;
const HEIGHT_MIN = 5;
const HEIGHT_MAX = 70;
const PREVIEW_RATIO = 0.6;

type Options = {
  widthRatio?: number;
  widthMin?: number;
  widthMax?: number;
  heightRatio?: number;
  heightMin?: number;
  heightMax?: number;
  previewRatio?: number;
};

export function compact(options: Options = {}): Layout {
  const widthRatio = options.widthRatio ?? WIDTH_RATIO;
  const widthMin = options.widthMin ?? WIDTH_MIN;
  const widthMax = options.widthMax ?? WIDTH_MAX;
  const heightRatio = options.heightRatio ?? HEIGHT_RATIO;
  const heightMin = options.heightMin ?? HEIGHT_MIN;
  const heightMax = options.heightMax ?? HEIGHT_MAX;
  const previewRatio = options.previewRatio ?? PREVIEW_RATIO;
  const dimension = (screenWidth: number, screenHeight: number) => {
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
  return {
    style2({ border, divider }: Theme): { input: Border; list: Border } {
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

    /*
     *                               Width
     *                ╭──────────────────────────────────╮
     *
     *             ╭─ ╭──────────────────────────────────╮ ─╮
     * inputHeight │  │                                  │  │
     *             ├─ ├╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┤  │
     *             │  │                                  │  │
     *             │  │                                  │  │
     *             │  │                                  │  │
     *             │  │                                  │  │
     *             │  │                                  │  │Height
     * listHeight  │  │                                  │  │
     *             │  │                                  │  │
     *             │  │                                  │  │
     *             │  │                                  │  │
     *             │  │                                  │  │
     *             │  │                                  │  │
     *             ╰─ ╰──────────────────────────────────╯ ─╯
     */
    layout2(
      { width: screenWidth, height: screenHeight }: Size,
    ): { input: Dimension; list: Dimension } {
      const { col, row, width, height } = dimension(
        screenWidth,
        screenHeight,
      );
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

    style3(
      { border, divider }: Theme,
    ): { input: Border; list: Border; preview: Border } {
      return {
        input: [
          border[BI.TopLeft],
          border[BI.Top],
          divider[DI.Top],
          divider[DI.Vertical],
          "",
          "",
          "",
          border[BI.Left],
        ],
        list: [
          divider[DI.Left],
          divider[DI.Horizonal],
          divider[DI.Right],
          divider[DI.Vertical],
          divider[DI.Bottom],
          border[BI.Bottom],
          border[BI.BottomLeft],
          border[BI.Left],
        ],
        preview: [
          "",
          border[BI.Top],
          border[BI.TopRight],
          border[BI.Right],
          border[BI.BottomRight],
          border[BI.Bottom],
          "",
          "",
        ],
      } as const;
    },

    /*
     *                               Width
     *                ╭──────────────────────────────────╮
     *
     *             ╭─ ╭────────────┬─────────────────────╮ ─╮
     * inputHeight │  │            │                     │  │
     *             ├─ ├╌╌╌╌╌╌╌╌╌╌╌╌┤                     │  │
     *             │  │            │                     │  │
     *             │  │            │                     │  │
     *             │  │            │                     │  │
     *             │  │            │                     │  │
     *             │  │            │                     │  │Height
     * listHeight  │  │            │                     │  │
     *             │  │            │                     │  │
     *             │  │            │                     │  │
     *             │  │            │                     │  │
     *             │  │            │                     │  │
     *             │  │            │                     │  │
     *             ╰─ ╰────────────┴─────────────────────╯ ─╯
     *                ╰────────────┴─────────────────────╯
     *                  mainWidth        previewWidth
     */
    layout3(
      { width: screenWidth, height: screenHeight }: Size,
    ): { input: Dimension; list: Dimension; preview: Dimension } {
      const { col, row, width, height } = dimension(
        screenWidth,
        screenHeight,
      );
      const previewWidth = Math.max(0, Math.floor(width * previewRatio));
      const previewInnerWidth = previewWidth - 2;
      const mainWidth = width - previewWidth;
      const mainInnerWidth = mainWidth - 1;
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
}
