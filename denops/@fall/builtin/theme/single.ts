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

export function single(): Theme {
  return {
    border: SINGLE_BORDER,
    divider: SINGLE_DIVIDER,
  };
}
