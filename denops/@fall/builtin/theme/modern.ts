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

/**
 * Modern Theme.
 *
 * This theme uses rounded corners for borders and dashed lines for dividers.
 * It is ideal for terminals that support box-drawing characters.
 *
 * It looks like this:
 *
 * ```
 * ╭─────────╮╭────┬────╮
 * │         ││    ╎    │
 * ├╌╌╌╌╌╌╌╌╌┤│    ╎    │
 * │         ││    ╎    │
 * ╰─────────╯╰────┴────╯
 * ```
 */
export const MODERN_THEME: Theme = {
  border: ROUNDED_BORDER,
  divider: DASHED_DIVIDER,
} as const;
