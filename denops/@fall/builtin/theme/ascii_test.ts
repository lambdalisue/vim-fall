import { assertEquals } from "jsr:@std/assert@^1.0.6";
import { renderTheme } from "../../util/testutil.ts";
import { ASCII_THEME } from "./ascii.ts";

Deno.test("ASCII_THEME", () => {
  assertEquals(renderTheme(ASCII_THEME), [
    "+---------++---------+",
    "|         ||    |    |",
    "|---------||    |    |",
    "|         ||    |    |",
    "+---------++---------+",
  ]);
});
