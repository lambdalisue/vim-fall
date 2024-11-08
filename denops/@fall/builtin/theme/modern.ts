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

export function modern(): Theme {
  return {
    border: ROUNDED_BORDER,
    divider: DASHED_DIVIDER,
  };
}
