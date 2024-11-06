/**
 * Adjusts the offset to ensure the cursor remains within the specified view boundaries.
 *
 * @param offset - The current offset position.
 * @param cursor - The cursor's target position within the view.
 * @param count - Total number of items.
 * @param viewSize - Size of the visible window or view.
 * @param scrollOffset - Minimum scroll offset to maintain around the cursor.
 *
 * @returns A new offset that keeps the cursor within the view bounds, adjusting as necessary
 *          based on the view size and scroll offset.
 */
export function adjustOffset(
  offset: number,
  cursor: number,
  count: number,
  viewSize: number,
  scrollOffset: number = 0,
): number {
  const viewOffset = cursor - offset;
  const maxViewOffset = viewSize - scrollOffset;
  const minViewOffset = scrollOffset;
  if (count < viewSize) {
    return 0;
  } else if (viewOffset >= maxViewOffset) {
    return Math.min(count - viewSize, cursor - maxViewOffset);
  } else if (viewOffset < minViewOffset) {
    return Math.min(count - viewSize, Math.max(0, cursor - minViewOffset + 1));
  }
  return offset;
}
