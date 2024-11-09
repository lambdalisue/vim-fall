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
  "│",
  "┴",
] as const;

/**
 * Single Theme.
 *
 * This theme uses single box-drawing characters for borders and dividers.
 *
 * It looks like this:
 *
 * ```
 * ┌─────────┐┌────┬────┐
 * │         ││    │    │
 * ├─────────┤│    │    │
 * │         ││    │    │
 * └─────────┘└────┴────┘
 * ```
 */
export const SINGLE_THEME: Theme = {
  border: SINGLE_BORDER,
  divider: SINGLE_DIVIDER,
} as const;
