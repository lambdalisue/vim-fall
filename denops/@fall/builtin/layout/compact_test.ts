import { assertEquals } from "jsr:@std/assert@^1.0.6";

import { modern } from "../theme/modern.ts";
import { buildCanvas, renderCanvas } from "../../util/testutil.ts";
import { compact } from "./compact.ts";

const SCREEN = {
  width: 40,
  height: 15,
} as const;

const MODERN_THEME = modern();

Deno.test("compact", async (t) => {
  const layout = compact({
    widthRatio: 0.8,
    heightRatio: 0.8,
  });

  await t.step("input-list style", () => {
    const borders = layout.style2(MODERN_THEME);
    const dimensions = layout.layout2(SCREEN);

    const canvas = buildCanvas(SCREEN);
    renderCanvas(canvas, borders.input, dimensions.input);
    renderCanvas(canvas, borders.list, dimensions.list);

    const content = canvas.map((row) => row.join(""));
    assertEquals(content, [
      "                                        ",
      "    ╭──────────────────────────────╮    ",
      "    │                              │    ",
      "    ├╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┤    ",
      "    │                              │    ",
      "    │                              │    ",
      "    │                              │    ",
      "    │                              │    ",
      "    │                              │    ",
      "    │                              │    ",
      "    │                              │    ",
      "    │                              │    ",
      "    ╰──────────────────────────────╯    ",
      "                                        ",
      "                                        ",
    ]);
  });

  await t.step("input-list-preview style", () => {
    const borders = layout.style3(MODERN_THEME);
    const dimensions = layout.layout3(SCREEN);

    const canvas = buildCanvas(SCREEN);
    renderCanvas(canvas, borders.input, dimensions.input);
    renderCanvas(canvas, borders.list, dimensions.list);
    renderCanvas(canvas, borders.preview, dimensions.preview);

    const content = canvas.map((row) => row.join(""));
    assertEquals(content, [
      "                                        ",
      "    ╭────────────┬─────────────────╮    ",
      "    │            ╎                 │    ",
      "    ├╌╌╌╌╌╌╌╌╌╌╌╌┤                 │    ",
      "    │            ╎                 │    ",
      "    │            ╎                 │    ",
      "    │            ╎                 │    ",
      "    │            ╎                 │    ",
      "    │            ╎                 │    ",
      "    │            ╎                 │    ",
      "    │            ╎                 │    ",
      "    │            ╎                 │    ",
      "    ╰────────────┴─────────────────╯    ",
      "                                        ",
      "                                        ",
    ]);
  });
});
