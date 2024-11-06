import type { Border, Divider, Theme } from "../../theme.ts";

export const SINGLE_BORDER: Border = [
  "┌",
  "─",
  "┐",
  "│",
  "┘",
  "─",
  "└",
  "│",
] as const;

export const SINGLE_DIVIDER: Divider = [
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
