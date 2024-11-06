/**
 * Theme interface.
 */
export type Theme = {
  /**
   * The border characters.
   */
  border: Border;
  /**
   * The divider characters.
   */
  divider: Divider;
};

export const BorderIndex = {
  TopLeft: 0,
  Top: 1,
  TopRight: 2,
  Right: 3,
  BottomRight: 4,
  Bottom: 5,
  BottomLeft: 6,
  Left: 7,
} as const;

export type BorderIndex = typeof BorderIndex[keyof typeof BorderIndex];

export type Border = readonly [
  topleft: string,
  top: string,
  topright: string,
  right: string,
  botright: string,
  bottom: string,
  botleft: string,
  left: string,
];

export const DividerIndex = {
  Left: 0,
  Horizonal: 1,
  Right: 2,
  Top: 3,
  Vertical: 4,
  Bottom: 5,
} as const;

export type DividerIndex = typeof DividerIndex[keyof typeof DividerIndex];

export type Divider = readonly [
  left: string,
  horizonal: string,
  right: string,
  top: string,
  vertical: string,
  bottom: string,
];
