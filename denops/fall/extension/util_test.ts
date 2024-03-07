import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.218.2/assert/mod.ts";
import { expand } from "./util.ts";

Deno.test("expand", () => {
  const names = [
    "open",
    "open:edit",
    "open:split",
    "open:vsplit",
    "diff",
    "diff:edit",
    "diff:split",
    "diff:vsplit",
    "my:open:edit",
    "my:open:split",
    "my:open:vsplit",
    "my:diff:edit",
    "my:diff:split",
    "my:diff:vsplit",
  ];
  assertEquals(expand("*", names), [
    "open",
    "open:edit",
    "open:split",
    "open:vsplit",
    "diff",
    "diff:edit",
    "diff:split",
    "diff:vsplit",
    "my:open:edit",
    "my:open:split",
    "my:open:vsplit",
    "my:diff:edit",
    "my:diff:split",
    "my:diff:vsplit",
  ]);
  assertEquals(expand("open", names), ["open"]);
  assertEquals(expand("diff", names), ["diff"]);
  assertEquals(expand("open:*", names), [
    "open:edit",
    "open:split",
    "open:vsplit",
  ]);
  assertEquals(expand("*:edit", names), [
    "open:edit",
    "diff:edit",
    "my:open:edit",
    "my:diff:edit",
  ]);
  assertEquals(expand("my:*:edit", names), [
    "my:open:edit",
    "my:diff:edit",
  ]);
  assertThrows(
    () => expand("my:*:*", names),
    Error,
    "Only one '*' is allowed in the expression.",
  );
});
