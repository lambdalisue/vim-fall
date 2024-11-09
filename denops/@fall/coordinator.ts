import type { Border, Theme } from "./theme.ts";

export type Size = {
  width: number;
  height: number;
};

export type Dimension = Size & {
  col: number;
  row: number;
};

export type Style = {
  input: Border;
  list: Border;
  preview?: Border;
};

export type Layout = {
  input: Dimension;
  list: Dimension;
  preview?: Dimension;
};

export type Coordinator = {
  /**
   * Style of the picker components.
   */
  style(theme: Theme): Style;

  /**
   * Layout of the picker components.
   */
  layout(screen: Size): Layout;
};
