import type { Border, Divider, Theme } from "../../theme.ts";

const DOUBLE_BORDER: Border = [
  "╔",
  "═",
  "╗",
  "║",
  "╝",
  "═",
  "╚",
  "║",
] as const;

const DOUBLE_DIVIDER: Divider = [
  "╠",
  "═",
  "╣",
  "╦",
  "═",
  "╩",
] as const;

export function double(): Theme {
  return {
    border: DOUBLE_BORDER,
    divider: DOUBLE_DIVIDER,
  };
}
