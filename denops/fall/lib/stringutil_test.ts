import { assertEquals } from "jsr:@std/assert@^1.0.8";
import { getByteLength } from "./stringutil.ts";

Deno.test("getByteLength", () => {
  assertEquals(getByteLength(""), 0);
  assertEquals(getByteLength("a"), 1);
  assertEquals(getByteLength("あ"), 3);
});
