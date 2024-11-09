import type { Border, Divider, Theme } from "../../theme.ts";

const SINGLE_BORDER: Border = [
  "┌",
  "─",
  "┐",
  "│",
  "┘",
  "─",
  "└",
  "│",
] as const;

const SINGLE_DIVIDER: Divider = [
  "├",
  "─",
  "┤",
  "┬",
  "─",
  "┴",
] as const;

export const SINGLE_THEME: Theme = {
  border: SINGLE_BORDER,
  divider: SINGLE_DIVIDER,
} as const;
