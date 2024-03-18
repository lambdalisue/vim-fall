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
        options: {
          opener: "edit",
        },
        variants: {
          split: {
            opener: "split",
          },
          "edit-split": {
            splitter: "split",
          },
        },
      },
      nested: {
        url: resolve("../../@fall-builtin/action/nested.ts"),
        options: {
          nested: {
            a: 1,
            b: [2, 3],
          },
        },
        variants: {
          a: {
            nested: {
              a: 2,
            },
          },
          b: {
            nested: {
              b: [3, 4],
            },
          },
          c: {
            nested: {
              a: 2,
              b: [3, 4],
            },
          },
        },
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
    ["action", "open", "../../@fall-builtin/action/open.ts", {
      opener: "edit",
    }],
    ["action", "open:split", "../../@fall-builtin/action/open.ts", {
      opener: "split",
    }],
    ["action", "open:edit-split", "../../@fall-builtin/action/open.ts", {
      opener: "edit",
      splitter: "split",
    }],
    ["action", "nested", "../../@fall-builtin/action/nested.ts", {
      nested: {
        a: 1,
        b: [2, 3],
      },
    }],
    ["action", "nested:a", "../../@fall-builtin/action/nested.ts", {
      nested: {
        a: 2,
        b: [2, 3],
      },
    }],
    ["action", "nested:b", "../../@fall-builtin/action/nested.ts", {
      nested: {
        a: 1,
        b: [3, 4],
      },
    }],
    ["action", "nested:c", "../../@fall-builtin/action/nested.ts", {
      nested: {
        a: 2,
        b: [3, 4],
      },
    }],
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

  await t.step("throws an error if no corresponding extension is found", () => {
    assertThrows(
      () => {
        getLoaderInfo("action", "nonexistent", extensionConfig);
      },
      Error,
      "No action extension 'nonexistent' found",
    );
  });
});
