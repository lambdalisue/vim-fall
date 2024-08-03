import { assertEquals } from "jsr:@std/assert@^0.225.1";
import { getByteLength } from "./text.ts";

Deno.test("getByteLength", () => {
  assertEquals(getByteLength("abcde"), 5);
  assertEquals(getByteLength("あいうえお"), 15);
  assertEquals(getByteLength("😀😀😀😀😀"), 20);
});
