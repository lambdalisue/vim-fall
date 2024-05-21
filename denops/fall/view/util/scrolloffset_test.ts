import { assertEquals } from "jsr:@std/assert@0.225.1";
import { calcScrollOffset } from "./scrolloffset.ts";

Deno.test("calcScrollOffset", async (t) => {
  const count = 10;
  const win = 5;
  const off = 2;
  /**
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
   */
  await t.step("scrolling to right", () => {
    assertEquals(calcScrollOffset(0, 0, count, win, off), 0);
    assertEquals(calcScrollOffset(0, 1, count, win, off), 0);
    assertEquals(calcScrollOffset(0, 2, count, win, off), 0);
    assertEquals(calcScrollOffset(0, 3, count, win, off), 0);
    assertEquals(calcScrollOffset(0, 4, count, win, off), 1);
    assertEquals(calcScrollOffset(1, 5, count, win, off), 2);
    assertEquals(calcScrollOffset(2, 6, count, win, off), 3);
    assertEquals(calcScrollOffset(3, 7, count, win, off), 4);
    assertEquals(calcScrollOffset(4, 8, count, win, off), 5);
    assertEquals(calcScrollOffset(5, 9, count, win, off), 5);
  });

  /**
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
  await t.step("scrolling to left", () => {
    assertEquals(calcScrollOffset(5, 9, count, win, off), 5);
    assertEquals(calcScrollOffset(5, 8, count, win, off), 5);
    assertEquals(calcScrollOffset(5, 7, count, win, off), 5);
    assertEquals(calcScrollOffset(5, 6, count, win, off), 5);
    assertEquals(calcScrollOffset(5, 5, count, win, off), 4);
    assertEquals(calcScrollOffset(5, 4, count, win, off), 3);
    assertEquals(calcScrollOffset(5, 3, count, win, off), 2);
    assertEquals(calcScrollOffset(5, 2, count, win, off), 1);
    assertEquals(calcScrollOffset(5, 1, count, win, off), 0);
    assertEquals(calcScrollOffset(5, 0, count, win, off), 0);
  });

  /**
   * ```
   * ┌v────────┐
   * │0 1 2 3  │
   * └^────────┘
   * ┌──v──────┐
   * │0 1 2 3  │
   * └──^──────┘
   * ┌────v────┐
   * │0 1 2 3  │
   * └────^────┘
   * ┌──────v──┐
   * │0 1 2 3  │
   * └──────^──┘
   * ```
   */
  await t.step("scrolling to right (count < win)", () => {
    const count = 4;
    const win = 5;
    const off = 5;
    assertEquals(calcScrollOffset(0, 0, count, win, off), 0);
    assertEquals(calcScrollOffset(0, 1, count, win, off), 0);
    assertEquals(calcScrollOffset(0, 2, count, win, off), 0);
    assertEquals(calcScrollOffset(0, 3, count, win, off), 0);
  });
});
