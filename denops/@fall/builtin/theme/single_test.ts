import { assertEquals } from "jsr:@std/assert@^1.0.6";
import { renderTheme } from "../../util/testutil.ts";
import { SINGLE_THEME } from "./single.ts";

Deno.test("SINGLE_THEME", () => {
  assertEquals(renderTheme(SINGLE_THEME), [
    "┌─────────┐┌────┬────┐",
    "│         ││    │    │",
    "├─────────┤│    │    │",
    "│         ││    │    │",
    "└─────────┘└────┴────┘",
  ]);
});
