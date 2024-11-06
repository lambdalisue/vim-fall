import type { Border, Divider, Theme } from "../../theme.ts";

export const ROUNDED_BORDER: Border = [
  "╭",
  "─",
  "╮",
  "│",
  "╯",
  "─",
  "╰",
  "│",
] as const;

export const DASHED_DIVIDER: Divider = [
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
