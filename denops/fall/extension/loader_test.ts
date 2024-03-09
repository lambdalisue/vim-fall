import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.218.2/assert/mod.ts";
import { _internal } from "./loader.ts";

Deno.test("getLoaderInfo", async (t) => {
  const { getLoaderInfo } = _internal;

  const testcases = [
    ["action", "open", "../../@fall-builtin/actions/open.ts", {}],
    ["action", "open:split", "../../@fall-builtin/actions/open.ts", {
      opener: "split",
    }],
    [
      "processor",
      "substring_filter",
      "../../@fall-builtin/processors/substring_filter.ts",
      {},
    ],
    ["previewer", "path", "../../@fall-builtin/previewers/path.ts", {}],
    ["source", "line", "../../@fall-builtin/sources/line.ts", {}],
  ] as const;
  for (const [kind, name, path, options] of testcases) {
    await t.step(`${kind} ${name}`, () => {
      assertEquals(getLoaderInfo(kind, name), [
        new URL(path, import.meta.url),
        options,
      ]);
    });
  }
});

Deno.test("parseExpr", () => {
  const { parseExpr } = _internal;
  assertEquals(parseExpr("open"), ["open", undefined]);
  assertEquals(parseExpr("open:split"), ["open", "split"]);
  assertEquals(parseExpr("open:edit-split"), ["open", "edit-split"]);
  assertEquals(parseExpr("my:open:edit"), ["my", "open:edit"]);
});

Deno.test("parsePattern", () => {
  const { parsePattern } = _internal;
  const exprs = [
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
  assertEquals(parsePattern("*", exprs), [
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
  assertEquals(parsePattern("open", exprs), ["open"]);
  assertEquals(parsePattern("diff", exprs), ["diff"]);
  assertEquals(parsePattern("open:*", exprs), [
    "open:edit",
    "open:split",
    "open:vsplit",
  ]);
  assertEquals(parsePattern("*:edit", exprs), [
    "open:edit",
    "diff:edit",
    "my:open:edit",
    "my:diff:edit",
  ]);
  assertEquals(parsePattern("my:*:edit", exprs), [
    "my:open:edit",
    "my:diff:edit",
  ]);
  assertThrows(
    () => parsePattern("my:*:*", exprs),
    Error,
    "Only one '*' is allowed in the expression.",
  );
});
