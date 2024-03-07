/**
 * Calculate the proper size based on the base size and the ratio.
 */
export function calcProperSize(
  base: number,
  ratio: number,
  min: number,
  max: number,
): number {
  const value = Math.floor(base * ratio);
  return Math.max(min, Math.min(max, value));
}
