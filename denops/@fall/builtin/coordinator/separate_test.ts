import { assertEquals } from "jsr:@std/assert@^1.0.6";

import { MODERN_THEME } from "../theme/modern.ts";
import { buildCanvas, renderBorder } from "../../util/testutil.ts";
import { separate } from "./separate.ts";

const WIDTH_RATIO = 0.8;
const HEIGHT_RATIO = 0.8;
const PREVIEW_RATIO = 0.5;
const SCREEN = {
  width: 40, // -> 32
  height: 15, // -> 12
} as const;

Deno.test("separate", async (t) => {
  await t.step("hidePreview=false", () => {
    const coordinator = separate({
      hidePreview: false,
      widthRatio: WIDTH_RATIO,
      heightRatio: HEIGHT_RATIO,
      previewRatio: PREVIEW_RATIO,
    });
    const borders = coordinator.style(MODERN_THEME);
    const dimensions = coordinator.layout(SCREEN);

    const width = SCREEN.width * WIDTH_RATIO;
    const height = SCREEN.height * HEIGHT_RATIO;

    assertEquals(dimensions.input.width + 2, width - width * PREVIEW_RATIO);
    assertEquals(dimensions.list.width + 2, width - width * PREVIEW_RATIO);
    assertEquals(dimensions.preview!.width + 2, width * PREVIEW_RATIO);
    assertEquals(dimensions.input.height + 2, 3);
    assertEquals(dimensions.list.height + 2, height - 3);
    assertEquals(dimensions.preview!.height + 2, height);

    const canvas = buildCanvas(SCREEN);
    renderBorder(canvas, borders.input, dimensions.input);
    renderBorder(canvas, borders.list, dimensions.list);
    renderBorder(canvas, borders.preview!, dimensions.preview!);

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

  await t.step("hidePreview=true", () => {
    const coordinator = separate({
      hidePreview: true,
      widthRatio: WIDTH_RATIO,
      heightRatio: HEIGHT_RATIO,
      previewRatio: PREVIEW_RATIO,
    });
    const borders = coordinator.style(MODERN_THEME);
    const dimensions = coordinator.layout(SCREEN);

    const canvas = buildCanvas(SCREEN);
    renderBorder(canvas, borders.input, dimensions.input);
    renderBorder(canvas, borders.list, dimensions.list);

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
});
