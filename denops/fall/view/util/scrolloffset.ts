/**
 * Calculate scroll offset
 *
 * From 0 to 9, window size is 5, and scrolloff is 2.
 * ```
 * ┌v────────┐
 * │0 1 2 3 4│5 6 7 8 9
 * └^────────┘
 * ┌──v──────┐
 * │0 1 2 3 4│5 6 7 8 9
 * └──^──────┘
 * ┌────v────┐
 * │0 1 2 3 4│5 6 7 8 9
 * └────^────┘
 * ┌──────v──┐
 * │0 1 2 3 4│5 6 7 8 9
 * └──────^──┘
 *   ┌──────v──┐
 *  0│1 2 3 4 5│6 7 8 9
 *   └──────^──┘
 *     ┌──────v──┐
 *  0 1│2 3 4 5 6│7 8 9
 *     └──────^──┘
 *       ┌──────v──┐
 *  0 1 2│3 4 5 6 7│8 9
 *       └──────^──┘
 *         ┌──────v──┐
 *  0 1 2 3│4 5 6 7 8│9
 *         └──────^──┘
 *           ┌──────v──┐
 *  0 1 2 3 4│5 6 7 8 9│
 *           └──────^──┘
 *           ┌────────v┐
 *  0 1 2 3 4│5 6 7 8 9│
 *           └────────^┘
 * ```
 *
 * From 9 to 0, window size is 5, and scrolloff is 2.
 * ```
 *           ┌────────v┐
 *  0 1 2 3 4│5 6 7 8 9│
 *           └────────^┘
 *           ┌──────v──┐
 *  0 1 2 3 4│5 6 7 8 9│
 *           └──────^──┘
 *           ┌────v────┐
 *  0 1 2 3 4│5 6 7 8 9│
 *           └────^────┘
 *           ┌──v──────┐
 *  0 1 2 3 4│5 6 7 8 9│
 *           └──^──────┘
 *         ┌──v──────┐
 *  0 1 2 3│4 5 6 7 8│9
 *         └──^──────┘
 *       ┌──v──────┐
 *  0 1 2│3 4 5 6 7│8 9
 *       └──^──────┘
 *     ┌──v──────┐
 *  0 1│2 3 4 5 6│7 8 9
 *     └──^──────┘
 *   ┌──v──────┐
 *  0│1 2 3 4 5│6 7 8 9
 *   └──^──────┘
 * ┌──v──────┐
 * │0 1 2 3 4│5 6 7 8 9
 * └──^──────┘
 * ┌v────────┐
 * │0 1 2 3 4│5 6 7 8 9
 * └^────────┘
 * ```
 */
export function calcScrollOffset(
  offset: number,
  index: number,
  count: number,
  window: number,
  scrolloff: number,
): number {
  const windowOffset = index - offset;
  const maxWindowOffset = window - scrolloff;
  const minWindowOffset = scrolloff;
  if (count < window) {
    return 0;
  } else if (windowOffset > maxWindowOffset) {
    return Math.min(count - window, index - maxWindowOffset);
  } else if (windowOffset < minWindowOffset) {
    return Math.max(0, index - minWindowOffset + 1);
  }
  return offset;
}
