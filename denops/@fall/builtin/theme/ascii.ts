import type { Border, Divider, Theme } from "../../theme.ts";

export const ASCII_BORDER: Border = [
  "+",
  "-",
  "+",
  "|",
  "+",
  "-",
  "+",
  "|",
] as const;

export const ASCII_DIVIDER: Divider = [
  "|",
  "-",
  "|",
  "-",
  "|",
  "-",
] as const;

export const ASCII_THEME: Theme = {
  border: ASCII_BORDER,
  divider: ASCII_DIVIDER,
} as const;
