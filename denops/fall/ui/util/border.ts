export type Border =
  | "none"
  | "ascii"
  | "single"
  | "double"
  | "rounded"
  | RawBorder;

export type RawBorder = readonly [
  topleft: string,
  top: string,
  topright: string,
  right: string,
  botright: string,
  bottom: string,
  botleft: string,
  left: string,
];

export const BORDER_TL = 0;
export const BORDER_T = 1;
export const BORDER_TR = 2;
export const BORDER_R = 3;
export const BORDER_BR = 4;
export const BORDER_B = 5;
export const BORDER_BL = 6;
export const BORDER_L = 7;

const DEFAULT_BORDER_SINGLE: RawBorder = [
  "┌",
  "─",
  "┐",
  "│",
  "┘",
  "─",
  "└",
  "│",
] as const;

const DEFAULT_BORDER_DOUBLE: RawBorder = [
  "╔",
  "═",
  "╗",
  "║",
  "╝",
  "═",
  "╚",
  "║",
] as const;

const DEFAULT_BORDER_ROUNDED: RawBorder = [
  "╭",
  "─",
  "╮",
  "│",
  "╯",
  "─",
  "╰",
  "│",
] as const;

const DEFAULT_BORDER_ASCII: RawBorder = [
  "+",
  "-",
  "+",
  "|",
  "+",
  "-",
  "+",
  "|",
] as const;

const DEFAULT_BORDER_NONE: RawBorder = [
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
] as const;

export function getBorder(border: Border): RawBorder {
  switch (border) {
    case "none":
      return DEFAULT_BORDER_NONE;
    case "ascii":
      return DEFAULT_BORDER_ASCII;
    case "single":
      return DEFAULT_BORDER_SINGLE;
    case "double":
      return DEFAULT_BORDER_DOUBLE;
    case "rounded":
      return DEFAULT_BORDER_ROUNDED;
    default:
      return border;
  }
}
