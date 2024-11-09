import {
  type Border,
  BorderIndex as BI,
  DividerIndex as DI,
  type Theme,
} from "../theme.ts";
import type { Dimension, Size } from "../coordinator.ts";

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
export function renderBorder(
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

/**
 * Render the theme sample.
 *
 * It returns the theme as like below:
 *
 * ```
 * ╭─────────╮╭────┬────╮
 * │         ││    ╎    │
 * ├╌╌╌╌╌╌╌╌╌┤│    ╎    │
 * │         ││    ╎    │
 * ╰─────────╯╰────┴────╯
 * ```
 *
 * @param theme The theme to render.
 */
export function renderTheme(theme: Theme): string[] {
  const width = 22;
  const halfWidth = width / 2;
  const height = 5;
  const canvas = buildCanvas({ width, height });
  const getChar = (x: number, y: number): string => {
    // Corners
    if (x === 0 && y === 0 || x === halfWidth && y === 0) {
      return theme.border[BI.TopLeft];
    }
    if (x === halfWidth - 1 && y === 0 || x === width - 1 && y === 0) {
      return theme.border[BI.TopRight];
    }
    if (x === 0 && y === height - 1 || x === halfWidth && y === height - 1) {
      return theme.border[BI.BottomLeft];
    }
    if (
      x === halfWidth - 1 && y === height - 1 ||
      x === width - 1 && y === height - 1
    ) {
      return theme.border[BI.BottomRight];
    }
    // Dividers
    if (x === 0 && y === 2) {
      return theme.divider[DI.Left];
    }
    if (x === halfWidth - 1 && y === 2) {
      return theme.divider[DI.Right];
    }
    if (y === 2 && x > 0 && x < halfWidth - 1) {
      return theme.divider[DI.Horizonal];
    }
    if (x === 16 && y === 0) {
      return theme.divider[DI.Top];
    }
    if (x === 16 && y === height - 1) {
      return theme.divider[DI.Bottom];
    }
    if (x === 16) {
      return theme.divider[DI.Vertical];
    }
    // Other borders
    if (x === 0 || x === halfWidth) {
      return theme.border[BI.Left];
    }
    if (x === halfWidth - 1 || x === width - 1) {
      return theme.border[BI.Right];
    }
    if (y === 0) {
      return theme.border[BI.Top];
    }
    if (y === height - 1) {
      return theme.border[BI.Bottom];
    }
    // Inside
    return " ";
  };
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      canvas[y][x] = getChar(x, y);
    }
  }
  return canvas.map((row) => row.join(""));
}
