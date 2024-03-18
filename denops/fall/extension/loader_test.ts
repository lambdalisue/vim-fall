import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.218.2/assert/mod.ts";
import { _internal } from "./loader.ts";

function resolve(url: string): string {
  return new URL(url, import.meta.url).toString();
}

Deno.test("getLoaderInfo", async (t) => {
  const { getLoaderInfo } = _internal;

  const extensionConfig = {
    action: {
      open: {
        url: resolve("../../@fall-builtin/action/open.ts"),
        variants: {
          split: {
            opener: "split",
          },
        },
      },
    },
    filter: {
      substring: {
        url: resolve("../../@fall-builtin/filter/substring.ts"),
      },
    },
    previewer: {
      text: {
        url: resolve("../../@fall-builtin/previewer/text.ts"),
      },
    },
    source: {
      line: {
        url:
          "https://raw.githubusercontent.com/vim-fall/package-common/main/source/line.ts",
      },
    },
  };

  const testcases = [
    ["action", "open", "../../@fall-builtin/action/open.ts", {}],
    ["action", "open:split", "../../@fall-builtin/action/open.ts", {
      opener: "split",
    }],
    [
      "filter",
      "substring",
      "../../@fall-builtin/filter/substring.ts",
      {},
    ],
    ["previewer", "text", "../../@fall-builtin/previewer/text.ts", {}],
    [
      "source",
      "line",
      "https://raw.githubusercontent.com/vim-fall/package-common/main/source/line.ts",
      {},
    ],
  ] as const;
  for (const [kind, name, path, options] of testcases) {
    await t.step(`${kind} ${name}`, () => {
      assertEquals(getLoaderInfo(kind, name, extensionConfig), [
        (new URL(path, import.meta.url)).toString(),
        options,
      ]);
    });
  }
});
