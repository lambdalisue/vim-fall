import { assertEquals } from "jsr:@std/assert@^1.0.0";
import { getByteLength } from "./text.ts";

Deno.test("getByteLength", () => {
  assertEquals(getByteLength("abcde"), 5);
  assertEquals(getByteLength("あいうえお"), 15);
  assertEquals(getByteLength("😀😀😀😀😀"), 20);
});
