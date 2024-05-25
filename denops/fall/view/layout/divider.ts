import type { Denops } from "https://deno.land/x/denops_std@v6.4.0/mod.ts";
import { collect } from "https://deno.land/x/denops_std@v6.4.0/batch/mod.ts";
import * as opt from "https://deno.land/x/denops_std@v6.4.0/option/mod.ts";
import { is, type Predicate } from "jsr:@core/unknownutil@3.18.0";

export const isDivider = is
  .UnionOf([
    is.LiteralOneOf(["none", "ascii", "single", "double", "dashed"] as const),
    is.UniformTupleOf(6, is.String),
  ]) satisfies Predicate<Divider>;

export type Divider =
  | "none"
  | "ascii"
  | "single"
  | "double"
  | "dashed"
  | RawDivider;

export type RawDivider = readonly [
  left: string,
  horizonal: string,
  right: string,
  top: string,
  vertical: string,
  bottom: string,
];

export const DIVIDER_L = 0;
export const DIVIDER_H = 1;
export const DIVIDER_R = 2;
export const DIVIDER_T = 3;
export const DIVIDER_V = 4;
export const DIVIDER_B = 5;

const DEFAULT_DIVIDER_SINGLE: RawDivider = [
  "├",
  "─",
  "┤",
  "┬",
  "─",
  "┴",
] as const;

const DEFAULT_DIVIDER_DOUBLE: RawDivider = [
  "╠",
  "═",
  "╣",
  "╦",
  "═",
  "╩",
] as const;

const DEFAULT_DIVIDER_DASHED: RawDivider = [
  "│",
  "╌",
  "│",
  "─",
  "╎",
  "─",
] as const;

const DEFAULT_DIVIDER_ASCII: RawDivider = [
  "|",
  "-",
  "|",
  "-",
  "|",
  "-",
] as const;

const DEFAULT_DIVIDER_NONE: RawDivider = [
  "",
  "",
  "",
  "",
  "",
  "",
] as const;

/**
 * Get default divider characters based on conditions explained in Vim's 'borderchars'.
 *
 * Note that the result is cached.
 */
export async function getDefaultDivider(denops: Denops): Promise<RawDivider> {
  if (getDefaultDividerCache !== undefined) {
    return getDefaultDividerCache;
  }
  try {
    const [encoding, ambiwidth] = await collect(
      denops,
      (denops) => [
        opt.encoding.get(denops),
        opt.ambiwidth.get(denops),
      ],
    );
    getDefaultDividerCache = encoding === "utf-8" && ambiwidth === "single"
      ? DEFAULT_DIVIDER_DOUBLE
      : DEFAULT_DIVIDER_ASCII;
    return getDefaultDividerCache;
  } catch (err) {
    // Fail silently
    console.debug(
      `[fall] Failed to get properties to determine default divider: ${err}`,
    );
    getDefaultDividerCache = DEFAULT_DIVIDER_ASCII;
    return getDefaultDividerCache;
  }
}
let getDefaultDividerCache: RawDivider | undefined;

export function getDivider(divider: Divider): RawDivider {
  switch (divider) {
    case "none":
      return DEFAULT_DIVIDER_NONE;
    case "ascii":
      return DEFAULT_DIVIDER_ASCII;
    case "single":
      return DEFAULT_DIVIDER_SINGLE;
    case "double":
      return DEFAULT_DIVIDER_DOUBLE;
    case "dashed":
      return DEFAULT_DIVIDER_DASHED;
    default:
      return divider;
  }
}
