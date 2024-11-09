import { assertEquals } from "jsr:@std/assert@^1.0.6";
import { renderTheme } from "../../util/testutil.ts";
import { MODERN_THEME } from "./modern.ts";

Deno.test("MODERN_THEME", () => {
  assertEquals(renderTheme(MODERN_THEME), [
    "╭─────────╮╭────┬────╮",
    "│         ││    ╎    │",
    "├╌╌╌╌╌╌╌╌╌┤│    ╎    │",
    "│         ││    ╎    │",
    "╰─────────╯╰────┴────╯",
  ]);
});
