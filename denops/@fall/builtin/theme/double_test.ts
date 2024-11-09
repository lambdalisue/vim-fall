import { assertEquals } from "jsr:@std/assert@^1.0.6";
import { renderTheme } from "../../util/testutil.ts";
import { DOUBLE_THEME } from "./double.ts";

Deno.test("DOUBLE_THEME", () => {
  assertEquals(renderTheme(DOUBLE_THEME), [
    "╔═════════╗╔════╦════╗",
    "║         ║║    ║    ║",
    "╠═════════╣║    ║    ║",
    "║         ║║    ║    ║",
    "╚═════════╝╚════╩════╝",
  ]);
});
