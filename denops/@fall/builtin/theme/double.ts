import type { Border, Divider, Theme } from "../../theme.ts";

export const DOUBLE_BORDER: Border = [
  "╔",
  "═",
  "╗",
  "║",
  "╝",
  "═",
  "╚",
  "║",
] as const;

export const DOUBLE_DIVIDER: Divider = [
  "╠",
  "═",
  "╣",
  "╦",
  "═",
  "╩",
] as const;

export const DOUBLE_THEME: Theme = {
  border: DOUBLE_BORDER,
  divider: DOUBLE_DIVIDER,
} as const;
