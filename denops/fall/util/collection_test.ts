import { assertEquals } from "jsr:@std/assert@^1.0.0";
import * as collection from "./collection.ts";

Deno.test("isDefined", async (t) => {
  await t.step("returns true if the value is not undefined", () => {
    assertEquals(collection.isDefined(""), true);
    assertEquals(collection.isDefined(0), true);
    assertEquals(collection.isDefined(false), true);
    assertEquals(collection.isDefined([]), true);
    assertEquals(collection.isDefined({}), true);
    assertEquals(collection.isDefined(null), true);
  });
  await t.step("returns false if the value is undefined", () => {
    assertEquals(collection.isDefined(undefined), false);
  });
});

Deno.test("any", async (t) => {
  await t.step("returns true if any of the values are true", () => {
    assertEquals(collection.any([false, true, false]), true);
  });
  await t.step("returns false if none of the values are true", () => {
    assertEquals(collection.any([false, false, false]), false);
  });
});
