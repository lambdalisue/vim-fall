import { assertEquals } from "jsr:@std/assert@^1.0.6";

import { MODERN_THEME } from "../theme/modern.ts";
import { buildCanvas, renderBorder } from "../../util/testutil.ts";
import { modern } from "./modern.ts";

const WIDTH_RATIO = 0.8;
const HEIGHT_RATIO = 0.8;
const SCREEN = {
  width: 40,
  height: 15,
} as const;

Deno.test("modern", async (t) => {
  await t.step("hidePreview=false", () => {
    const coordinator = modern({
      hidePreview: false,
      widthRatio: WIDTH_RATIO,
      heightRatio: HEIGHT_RATIO,
    });
    const borders = coordinator.style(MODERN_THEME);
    const dimensions = coordinator.layout(SCREEN);

    const canvas = buildCanvas(SCREEN);
    renderBorder(canvas, borders.input, dimensions.input);
    renderBorder(canvas, borders.list, dimensions.list);
    renderBorder(canvas, borders.preview!, dimensions.preview!);

    const content = canvas.map((row) => row.join(""));
    assertEquals(content, [
      "                                        ",
      "    ╭───────────╮╭─────────────────╮    ",
      "    │           ││                 │    ",
      "    ├╌╌╌╌╌╌╌╌╌╌╌┤│                 │    ",
      "    │           ││                 │    ",
      "    │           ││                 │    ",
      "    │           ││                 │    ",
      "    │           ││                 │    ",
      "    │           ││                 │    ",
      "    │           ││                 │    ",
      "    │           ││                 │    ",
      "    │           ││                 │    ",
      "    ╰───────────╯╰─────────────────╯    ",
      "                                        ",
      "                                        ",
    ]);
  });

  await t.step("hidePreview=true", () => {
    const coordinator = modern({
      hidePreview: true,
      widthRatio: WIDTH_RATIO,
      heightRatio: HEIGHT_RATIO,
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
});
