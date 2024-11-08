import { type Border, BorderIndex as BI } from "../theme.ts";
import type { Dimension, Size } from "../layout.ts";

/**
 * Build a canvas with the given size.
 *
 * @param width The width of the canvas.
 * @param height The height of the canvas.
 * @returns The canvas.
 */
export function buildCanvas({ width, height }: Size): string[][] {
  return [...Array(height)].map(() => [...Array(width)].fill(" "));
}

/**
 * Render the border of the canvas.
 *
 * @param canvas The canvas to render.
 * @param border The border to render.
 * @param dimension The dimension of the canvas.
 * @returns The canvas with the border.
 */
export function renderCanvas(
  canvas: string[][],
  border: Border,
  dimension: Dimension,
): void {
  const getChar = (x: number, y: number): string => {
    if (y === 0 && x === 0) {
      // top-left
      return border[BI.TopLeft];
    } else if (y === 0 && x === width + 1) {
      // top-right
      return border[BI.TopRight];
    } else if (y === height + 1 && x === 0) {
      // bottom-left
      return border[BI.BottomLeft];
    } else if (y === height + 1 && x === width + 1) {
      // bottom-right
      return border[BI.BottomRight];
    } else if (y === 0) {
      // top
      return border[BI.Top];
    } else if (y === height + 1) {
      // bottom
      return border[BI.Bottom];
    } else if (x === 0) {
      // left
      return border[BI.Left];
    } else if (x === width + 1) {
      // right
      return border[BI.Right];
    } else {
      // inside
      return "";
    }
  };
  const { row, col, width, height } = dimension;
  for (let y = 0; y < height + 2; y++) {
    for (let x = 0; x < width + 2; x++) {
      const char = getChar(x, y);
      if (char) {
        canvas[row + y][col + x] = char;
      }
    }
  }
}
