import type { Border, Theme } from "./theme.ts";

export type Layout = {
  /**
   * Style of the picker without preview.
   */
  style2(theme: Theme): {
    input: Border;
    list: Border;
  };

  /**
   * Layout of the picker without preview.
   */
  layout2(screen: Size): {
    input: Dimension;
    list: Dimension;
  };

  /**
   * Style of the picker with preview.
   */
  style3(theme: Theme): {
    input: Border;
    list: Border;
    preview: Border;
  };

  /**
   * Layout of the picker with preview.
   */
  layout3(screen: Size): {
    input: Dimension;
    list: Dimension;
    preview: Dimension;
  };
};

export type Size = {
  width: number;
  height: number;
};

export type Dimension = Size & {
  col: number;
  row: number;
};
