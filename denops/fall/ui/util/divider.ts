export type Divider =
  | "none"
  | "ascii"
  | "single"
  | "double"
  | "dashed"
  | RawDivider;

export type RawDivider = readonly [
  left: string,
  horizonal: string,
  right: string,
  top: string,
  vertical: string,
  bottom: string,
];

export const DIVIDER_L = 0;
export const DIVIDER_H = 1;
export const DIVIDER_R = 2;
export const DIVIDER_T = 3;
export const DIVIDER_V = 4;
export const DIVIDER_B = 5;

const DEFAULT_DIVIDER_SINGLE: RawDivider = [
  "├",
  "─",
  "┤",
  "┬",
  "─",
  "┴",
] as const;

const DEFAULT_DIVIDER_DOUBLE: RawDivider = [
  "╠",
  "═",
  "╣",
  "╦",
  "═",
  "╩",
] as const;

const DEFAULT_DIVIDER_DASHED: RawDivider = [
  "│",
  "╌",
  "│",
  "─",
  "╎",
  "─",
] as const;

const DEFAULT_DIVIDER_ASCII: RawDivider = [
  "|",
  "-",
  "|",
  "-",
  "|",
  "-",
] as const;

const DEFAULT_DIVIDER_NONE: RawDivider = [
  "",
  "",
  "",
  "",
  "",
  "",
] as const;

export function getDivider(divider: Divider): RawDivider {
  switch (divider) {
    case "none":
      return DEFAULT_DIVIDER_NONE;
    case "ascii":
      return DEFAULT_DIVIDER_ASCII;
    case "single":
      return DEFAULT_DIVIDER_SINGLE;
    case "double":
      return DEFAULT_DIVIDER_DOUBLE;
    case "dashed":
      return DEFAULT_DIVIDER_DASHED;
    default:
      return divider;
  }
}
