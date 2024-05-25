import type { Denops } from "https://deno.land/x/denops_std@v6.4.0/mod.ts";
import { collect } from "https://deno.land/x/denops_std@v6.4.0/batch/mod.ts";
import * as opt from "https://deno.land/x/denops_std@v6.4.0/option/mod.ts";
import { is, type Predicate } from "jsr:@core/unknownutil@3.18.0";

export const isBorder = is.UnionOf([
  is.LiteralOneOf(["none", "ascii", "single", "double", "rounded"] as const),
  is.UniformTupleOf(8, is.String),
]) satisfies Predicate<Border>;

export type Border =
  | "none"
  | "ascii"
  | "single"
  | "double"
  | "rounded"
  | RawBorder;

export type RawBorder = readonly [
  topleft: string,
  top: string,
  topright: string,
  right: string,
  botright: string,
  bottom: string,
  botleft: string,
  left: string,
];

export const BORDER_TL = 0;
export const BORDER_T = 1;
export const BORDER_TR = 2;
export const BORDER_R = 3;
export const BORDER_BR = 4;
export const BORDER_B = 5;
export const BORDER_BL = 6;
export const BORDER_L = 7;

const DEFAULT_BORDER_SINGLE: RawBorder = [
  "┌",
  "─",
  "┐",
  "│",
  "┘",
  "─",
  "└",
  "│",
] as const;

const DEFAULT_BORDER_DOUBLE: RawBorder = [
  "╔",
  "═",
  "╗",
  "║",
  "╝",
  "═",
  "╚",
  "║",
] as const;

const DEFAULT_BORDER_ROUNDED: RawBorder = [
  "╭",
  "─",
  "╮",
  "│",
  "╯",
  "─",
  "╰",
  "│",
] as const;

const DEFAULT_BORDER_ASCII: RawBorder = [
  "+",
  "-",
  "+",
  "|",
  "+",
  "-",
  "+",
  "|",
] as const;

const DEFAULT_BORDER_NONE: RawBorder = [
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
] as const;

/**
 * Get default border characters based on conditions explained in Vim's 'borderchars'.
 *
 * Note that the result is cached.
 */
export async function getDefaultBorder(denops: Denops): Promise<RawBorder> {
  if (getDefaultBorderCache !== undefined) {
    return getDefaultBorderCache;
  }
  try {
    const [encoding, ambiwidth] = await collect(
      denops,
      (denops) => [
        opt.encoding.get(denops),
        opt.ambiwidth.get(denops),
      ],
    );
    getDefaultBorderCache = encoding === "utf-8" && ambiwidth === "single"
      ? DEFAULT_BORDER_DOUBLE
      : DEFAULT_BORDER_ASCII;
    return getDefaultBorderCache;
  } catch (err) {
    // Fail silently
    console.debug(
      `[fall] Failed to get properties to determine default border: ${err}`,
    );
    getDefaultBorderCache = DEFAULT_BORDER_ASCII;
    return getDefaultBorderCache;
  }
}
let getDefaultBorderCache: RawBorder | undefined;

export function getBorder(border: Border): RawBorder {
  switch (border) {
    case "none":
      return DEFAULT_BORDER_NONE;
    case "ascii":
      return DEFAULT_BORDER_ASCII;
    case "single":
      return DEFAULT_BORDER_SINGLE;
    case "double":
      return DEFAULT_BORDER_DOUBLE;
    case "rounded":
      return DEFAULT_BORDER_ROUNDED;
    default:
      return border;
  }
}
