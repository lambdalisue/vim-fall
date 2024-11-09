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

/**
 * ASCII Theme.
 *
 * This theme uses only ASCII characters for borders and dividers.
 * It is ideal for terminals that do not support box-drawing characters.
 *
 * It looks like this:
 *
 * ```
 * +---------++---------+
 * |         ||    |    |
 * |---------||    |    |
 * |         ||    |    |
 * +---------++---------+
 * ```
 */
export const ASCII_THEME: Theme = {
  border: ASCII_BORDER,
  divider: ASCII_DIVIDER,
} as const;
