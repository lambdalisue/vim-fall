import type { Border, Divider, Theme } from "../../theme.ts";

const ROUNDED_BORDER: Border = [
  "╭",
  "─",
  "╮",
  "│",
  "╯",
  "─",
  "╰",
  "│",
] as const;

const DASHED_DIVIDER: Divider = [
  "├",
  "╌",
  "┤",
  "┬",
  "╎",
  "┴",
] as const;

export const MODERN_THEME: Theme = {
  border: ROUNDED_BORDER,
  divider: DASHED_DIVIDER,
} as const;
