import type { Border, Divider, Theme } from "../../theme.ts";

const DOUBLE_BORDER: Border = [
  "╔",
  "═",
  "╗",
  "║",
  "╝",
  "═",
  "╚",
  "║",
] as const;

const DOUBLE_DIVIDER: Divider = [
  "╠",
  "═",
  "╣",
  "╦",
  "║",
  "╩",
] as const;

/**
 * Double Theme.
 *
 * This theme uses double box-drawing characters for borders and dividers.
 *
 * It looks like this:
 *
 * ```
 * ╔═════════╗╔════╦════╗
 * ║         ║║    ║    ║
 * ╠═════════╣║    ║    ║
 * ║         ║║    ║    ║
 * ╚═════════╝╚════╩════╝
 * ```
 */
export const DOUBLE_THEME: Theme = {
  border: DOUBLE_BORDER,
  divider: DOUBLE_DIVIDER,
} as const;
