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

export class ModernLayout implements Layout {
  readonly #widthRatio: number;
  readonly #widthMin: number;
  readonly #widthMax: number;
  readonly #heightRatio: number;
  readonly #heightMin: number;
  readonly #heightMax: number;
  readonly #previewRatio: number;

  constructor(options: Options = {}) {
    this.#widthRatio = options.widthRatio ?? WIDTH_RATIO;
    this.#widthMin = options.widthMin ?? WIDTH_MIN;
    this.#widthMax = options.widthMax ?? WIDTH_MAX;
    this.#heightRatio = options.heightRatio ?? HEIGHT_RATIO;
    this.#heightMin = options.heightMin ?? HEIGHT_MIN;
    this.#heightMax = options.heightMax ?? HEIGHT_MAX;
    this.#previewRatio = options.previewRatio ?? PREVIEW_RATIO;
  }

  #dimension(screenWidth: number, screenHeight: number) {
    const width = Math.min(
      this.#widthMax,
      Math.max(this.#widthMin, Math.floor(screenWidth * this.#widthRatio)),
    );
    const height = Math.min(
      this.#heightMax,
      Math.max(this.#heightMin, Math.floor(screenHeight * this.#heightRatio)),
    );
    const col = Math.floor((screenWidth - width) / 2);
    const row = Math.floor((screenHeight - height) / 2);
    return { col, row, width, height };
  }

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
  }

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
    const { col, row, width, height } = this.#dimension(
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
  }

  style3(
    { border, divider }: Theme,
  ): { input: Border; list: Border; preview: Border } {
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
  }

  /*
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
   */
  layout3(
    { width: screenWidth, height: screenHeight }: Size,
  ): { input: Dimension; list: Dimension; preview: Dimension } {
    const { col, row, width, height } = this.#dimension(
      screenWidth,
      screenHeight,
    );
    const previewWidth = Math.max(0, Math.floor(width * this.#previewRatio));
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
  }
}
