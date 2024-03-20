import { assertEquals } from "https://deno.land/std@0.220.1/assert/mod.ts";
import { _internal } from "./extension.ts";

function resolve(url: string): string {
  return new URL(url, import.meta.url).toString();
}

Deno.test("purifyExtensionConfig", async (t) => {
  const { purifyExtensionConfig } = _internal;

  await t.step("returns an empty object for non-object input", () => {
    const input = "not an object";
    const expected = {};
    const result = purifyExtensionConfig(input);
    assertEquals(result, expected);
  });

  await t.step("handles invalid extension kinds", () => {
    const input = {
      invalidKind: {
        "name": {
          url: "https://example.com/extension.ts",
        },
      },
    };
    const expected = {};
    const result = purifyExtensionConfig(input);
    assertEquals(result, expected);
  });

  await t.step("handles non-object values for extension kinds", () => {
    const input = {
      source: "not an object",
    };
    const expected = {};
    const result = purifyExtensionConfig(input);
    assertEquals(result, expected);
  });

  await t.step("handles invalid loader config objects", () => {
    const input = {
      source: {
        "name": "not an object",
      },
    };
    const expected = {
      source: {},
    };
    const result = purifyExtensionConfig(input);
    assertEquals(result, expected);
  });

  await t.step("handles missing URL in loader config", () => {
    const input = {
      source: {
        "name": {
          options: { option: "value" },
        },
      },
    };
    const expected = {
      source: {},
    };
    const result = purifyExtensionConfig(input);
    assertEquals(result, expected);
  });

  await t.step("handles invalid options in loader config", () => {
    const input = {
      source: {
        "name": {
          url: "https://example.com/extension.ts",
          options: "not an object",
        },
      },
    };
    const expected = {
      source: {
        "name": {
          url: "https://example.com/extension.ts",
        },
      },
    };
    const result = purifyExtensionConfig(input);
    assertEquals(result, expected);
  });

  await t.step("handles invalid variants in loader config", () => {
    const input = {
      source: {
        "name": {
          url: "https://example.com/extension.ts",
          variants: "not an object",
        },
      },
    };
    const expected = {
      source: {
        "name": {
          url: "https://example.com/extension.ts",
        },
      },
    };
    const result = purifyExtensionConfig(input);
    assertEquals(result, expected);
  });

  await t.step("handles invalid variant values in loader config", () => {
    const input = {
      source: {
        "name": {
          url: "https://example.com/extension.ts",
          variants: {
            variant: "not an object",
          },
        },
      },
    };
    const expected = {
      source: {
        "name": {
          url: "https://example.com/extension.ts",
          variants: {},
        },
      },
    };
    const result = purifyExtensionConfig(input);
    assertEquals(result, expected);
  });

  await t.step("handles valid config", () => {
    const input = {
      source: {
        "name": {
          url: "https://example.com/extension.ts",
          options: { option: "value" },
          variants: {
            variant: { option: "value" },
          },
        },
      },
      renderer: {
        "name": {
          url: "https://example.com/renderer.ts",
        },
      },
    };
    const expected = {
      source: {
        "name": {
          url: "https://example.com/extension.ts",
          options: { option: "value" },
          variants: {
            variant: { option: "value" },
          },
        },
      },
      renderer: {
        "name": {
          url: "https://example.com/renderer.ts",
        },
      },
    };
    const result = purifyExtensionConfig(input);
    assertEquals(result, expected);
  });
});

Deno.test("resolveExtensionConfig", () => {
  const { resolveExtensionConfig } = _internal;
  const baseUrl = new URL("file:///path/to/base/");
  const conf = {
    source: {
      "local": {
        url: "relative/path/to/source.ts",
        options: { option: "value" },
      },
      "builtin": {
        url: "fallbuiltin://path/to/builtin",
      },
      "external": {
        url: "https://example.com/source.ts",
      },
    },
    renderer: {
      "local": {
        url: "relative/path/to/renderer.ts",
      },
      "builtin": {
        url: "fallbuiltin://path/to/builtin",
      },
      "external": {
        url: "https://example.com/renderer.ts",
      },
    },
  };

  const expected = {
    source: {
      "local": {
        url: "file:///path/to/base/relative/path/to/source.ts",
        options: { option: "value" },
      },
      "builtin": {
        url: resolve("../../@fall-builtin/path/to/builtin"),
      },
      "external": {
        url: "https://example.com/source.ts",
      },
    },
    renderer: {
      "local": {
        url: "file:///path/to/base/relative/path/to/renderer.ts",
      },
      "builtin": {
        url: resolve("../../@fall-builtin/path/to/builtin"),
      },
      "external": {
        url: "https://example.com/renderer.ts",
      },
    },
  };

  resolveExtensionConfig(conf, baseUrl);
  assertEquals(conf, expected);
});
