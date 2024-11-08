import type { Border, Divider, Theme } from "../../theme.ts";

const ASCII_BORDER: Border = [
  "+",
  "-",
  "+",
  "|",
  "+",
  "-",
  "+",
  "|",
] as const;

const ASCII_DIVIDER: Divider = [
  "|",
  "-",
  "|",
  "-",
  "|",
  "-",
] as const;

export function ascii(): Theme {
  return {
    border: ASCII_BORDER,
    divider: ASCII_DIVIDER,
  };
}
