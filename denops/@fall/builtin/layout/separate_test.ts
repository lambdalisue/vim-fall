import { assertEquals } from "jsr:@std/assert@^1.0.6";

import { modern } from "../theme/modern.ts";
import { buildCanvas, renderCanvas } from "../../util/testutil.ts";
import { separate } from "./separate.ts";

const SCREEN = {
  width: 40, // -> 32
  height: 15, // -> 12
} as const;

const MODERN_THEME = modern();

const WIDTH_RATIO = 0.8;
const HEIGHT_RATIO = 0.8;
const PREVIEW_RATIO = 0.5;

Deno.test("separate", async (t) => {
  const layout = separate({
    widthRatio: WIDTH_RATIO,
    heightRatio: HEIGHT_RATIO,
    previewRatio: PREVIEW_RATIO,
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
      "    ╰──────────────────────────────╯    ",
      "    ╭──────────────────────────────╮    ",
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

    const width = SCREEN.width * WIDTH_RATIO;
    const height = SCREEN.height * HEIGHT_RATIO;

    assertEquals(dimensions.input.width + 2, width - width * PREVIEW_RATIO);
    assertEquals(dimensions.list.width + 2, width - width * PREVIEW_RATIO);
    assertEquals(dimensions.preview.width + 2, width * PREVIEW_RATIO);
    assertEquals(dimensions.input.height + 2, 3);
    assertEquals(dimensions.list.height + 2, height - 3);
    assertEquals(dimensions.preview.height + 2, height);

    const canvas = buildCanvas(SCREEN);
    renderCanvas(canvas, borders.input, dimensions.input);
    renderCanvas(canvas, borders.list, dimensions.list);
    renderCanvas(canvas, borders.preview, dimensions.preview);

    const content = canvas.map((row) => row.join(""));
    assertEquals(content, [
      "                                        ",
      "    ╭──────────────╮╭──────────────╮    ",
      "    │              ││              │    ",
      "    ╰──────────────╯│              │    ",
      "    ╭──────────────╮│              │    ",
      "    │              ││              │    ",
      "    │              ││              │    ",
      "    │              ││              │    ",
      "    │              ││              │    ",
      "    │              ││              │    ",
      "    │              ││              │    ",
      "    │              ││              │    ",
      "    ╰──────────────╯╰──────────────╯    ",
      "                                        ",
      "                                        ",
    ]);
  });
});
