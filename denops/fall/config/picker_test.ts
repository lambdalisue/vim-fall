import { assertEquals } from "https://deno.land/std@0.220.1/assert/mod.ts";
import { _internal } from "./picker.ts";

Deno.test("purifyLayoutParams", async (t) => {
  const { purifyLayoutParams } = _internal;

  await t.step("returns empty object if data is not a valid object", () => {
    assertEquals(purifyLayoutParams("name", null), {});
    assertEquals(purifyLayoutParams("name", undefined), {});
    assertEquals(purifyLayoutParams("name", 1), {});
    assertEquals(purifyLayoutParams("name", "1"), {});
    assertEquals(purifyLayoutParams("name", true), {});
    assertEquals(purifyLayoutParams("name", []), {});
  });

  await t.step("returns empty object if data is empty object", () => {
    assertEquals(purifyLayoutParams("name", {}), {});
  });
});
