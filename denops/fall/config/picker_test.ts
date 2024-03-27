import {
  assert,
  assertEquals,
  assertFalse,
} from "https://deno.land/std@0.220.1/assert/mod.ts";
import { _internal } from "./picker.ts";

Deno.test("purifyLayoutParams", async (t) => {
  const { purifyLayoutParams } = _internal;
  const name = "name";

  await t.step("with invalid value", () => {
    assertEquals(purifyLayoutParams(name, null), {});
    assertEquals(purifyLayoutParams(name, undefined), {});
    assertEquals(purifyLayoutParams(name, 1), {});
    assertEquals(purifyLayoutParams(name, "1"), {});
    assertEquals(purifyLayoutParams(name, true), {});
    assertEquals(purifyLayoutParams(name, []), {});
  });

  await t.step("title", async (t) => {
    await t.step("with invalid value", () => {
      const params = purifyLayoutParams(name, { title: 0 });
      assertFalse("title" in params);
    });
    await t.step("with valid value", () => {
      const params = purifyLayoutParams(name, { title: "title" });
      assertEquals(params.title, "title");
    });
  });

  await t.step("width", async (t) => {
    await t.step("with invalid value", () => {
      const params = purifyLayoutParams(name, { width: "invalid" });
      assertFalse("width" in params);
    });
    await t.step("with valid value", () => {
      const params = purifyLayoutParams(name, { width: 100 });
      assertEquals(params.width, 100);
    });
  });

  await t.step("widthRatio", async (t) => {
    await t.step("with invalid value", () => {
      const params = purifyLayoutParams(name, { widthRatio: "invalid" });
      assertFalse("widthRatio" in params);
    });
    await t.step("with valid value", () => {
      const params = purifyLayoutParams(name, { widthRatio: 0.5 });
      assertEquals(params.widthRatio, 0.5);
    });
  });

  await t.step("widthMin", async (t) => {
    await t.step("with invalid value", () => {
      const params = purifyLayoutParams(name, { widthMin: "invalid" });
      assertFalse("widthMin" in params);
    });
    await t.step("with valid value", () => {
      const params = purifyLayoutParams(name, { widthMin: 100 });
      assertEquals(params.widthMin, 100);
    });
  });

  await t.step("widthMax", async (t) => {
    await t.step("with invalid value", () => {
      const params = purifyLayoutParams(name, { widthMax: "invalid" });
      assertFalse("widthMax" in params);
    });
    await t.step("with valid value", () => {
      const params = purifyLayoutParams(name, { widthMax: 100 });
      assertEquals(params.widthMax, 100);
    });
  });

  await t.step("height", async (t) => {
    await t.step("with invalid value", () => {
      const params = purifyLayoutParams(name, { height: "invalid" });
      assertFalse("height" in params);
    });
    await t.step("with valid value", () => {
      const params = purifyLayoutParams(name, { height: 100 });
      assertEquals(params.height, 100);
    });
  });

  await t.step("heightRatio", async (t) => {
    await t.step("with invalid value", () => {
      const params = purifyLayoutParams(name, { heightRatio: "invalid" });
      assertFalse("heightRatio" in params);
    });
    await t.step("with valid value", () => {
      const params = purifyLayoutParams(name, { heightRatio: 0.5 });
      assertEquals(params.heightRatio, 0.5);
    });
  });

  await t.step("heightMin", async (t) => {
    await t.step("with invalid value", () => {
      const params = purifyLayoutParams(name, { heightMin: "invalid" });
      assertFalse("heightMin" in params);
    });
    await t.step("with valid value", () => {
      const params = purifyLayoutParams(name, { heightMin: 100 });
      assertEquals(params.heightMin, 100);
    });
  });

  await t.step("heightMax", async (t) => {
    await t.step("with invalid value", () => {
      const params = purifyLayoutParams(name, { heightMax: "invalid" });
      assertFalse("heightMax" in params);
    });
    await t.step("with valid value", () => {
      const params = purifyLayoutParams(name, { heightMax: 100 });
      assertEquals(params.heightMax, 100);
    });
  });

  await t.step("previewRatio", async (t) => {
    await t.step("with invalid value", () => {
      const params = purifyLayoutParams(name, { previewRatio: "invalid" });
      assertFalse("previewRatio" in params);
    });
    await t.step("with valid value", () => {
      const params = purifyLayoutParams(name, { previewRatio: 0.5 });
      assertEquals(params.previewRatio, 0.5);
    });
  });

  await t.step("border", async (t) => {
    await t.step("with invalid value", () => {
      const params = purifyLayoutParams(name, { border: "invalid" });
      assertFalse("border" in params);
    });
    await t.step("with valid value", () => {
      const params = purifyLayoutParams(name, { border: "single" });
      assertEquals(params.border, "single");
    });
    await t.step("with valid value (string array)", () => {
      const params = purifyLayoutParams(name, {
        border: [
          "┌",
          "─",
          "┐",
          "│",
          "┘",
          "─",
          "└",
          "│",
        ],
      });
      assertEquals(params.border, [
        "┌",
        "─",
        "┐",
        "│",
        "┘",
        "─",
        "└",
        "│",
      ]);
    });
  });

  await t.step("divider", async (t) => {
    await t.step("with invalid value", () => {
      const params = purifyLayoutParams(name, { divider: "invalid" });
      assertFalse("divider" in params);
    });
    await t.step("with valid value", () => {
      const params = purifyLayoutParams(name, { divider: "single" });
      assertEquals(params.divider, "single");
    });
    await t.step("with valid value (string array)", () => {
      const params = purifyLayoutParams(name, {
        divider: [
          "├",
          "─",
          "┤",
          "┬",
          "─",
          "┴",
        ],
      });
      assertEquals(params.divider, [
        "├",
        "─",
        "┤",
        "┬",
        "─",
        "┴",
      ]);
    });
  });

  await t.step("zindex", async (t) => {
    await t.step("with invalid value", () => {
      const params = purifyLayoutParams(name, { zindex: "invalid" });
      assertFalse("zindex" in params);
    });
    await t.step("with valid value", () => {
      const params = purifyLayoutParams(name, { zindex: 10 });
      assertEquals(params.zindex, 10);
    });
  });
});

Deno.test("purifyPickerConfigOptions", async (t) => {
  const { purifyPickerConfigOptions } = _internal;
  const name = "name";

  await t.step("with invalid value", () => {
    assertEquals(purifyPickerConfigOptions(name, null), {});
    assertEquals(purifyPickerConfigOptions(name, undefined), {});
    assertEquals(purifyPickerConfigOptions(name, 1), {});
    assertEquals(purifyPickerConfigOptions(name, "1"), {});
    assertEquals(purifyPickerConfigOptions(name, true), {});
    assertEquals(purifyPickerConfigOptions(name, []), {});
  });

  await t.step("layout", async (t) => {
    await t.step("with invalid value", () => {
      const options = purifyPickerConfigOptions(name, { layout: 0 });
      assertFalse("layout" in options);
    });
    await t.step("with valid value", () => {
      const options = purifyPickerConfigOptions(name, { layout: {} });
      assertEquals(options.layout, {});
    });
  });

  await t.step("itemCollector", async (t) => {
    await t.step("with invalid value", () => {
      const options = purifyPickerConfigOptions(name, { itemCollector: 0 });
      assertFalse("itemCollector" in options);
    });
    await t.step("with valid value (empty)", () => {
      const options = purifyPickerConfigOptions(name, { itemCollector: {} });
      assertEquals(options.itemCollector, {});
    });
    await t.step("with invalid value (chunkSize)", () => {
      const options = purifyPickerConfigOptions(name, {
        itemCollector: {
          chunkSize: "invalid",
        },
      });
      assertEquals(options.itemCollector, {});
    });
    await t.step("with valid value (chunkSize)", () => {
      const options = purifyPickerConfigOptions(name, {
        itemCollector: {
          chunkSize: 10,
        },
      });
      assertEquals(options.itemCollector, {
        chunkSize: 10,
      });
    });
  });

  await t.step("prompt", async (t) => {
    await t.step("with invalid value", () => {
      const options = purifyPickerConfigOptions(name, { prompt: 0 });
      assertFalse("prompt" in options);
    });
    await t.step("with valid value (empty)", () => {
      const options = purifyPickerConfigOptions(name, { prompt: {} });
      assertEquals(options.prompt, {});
    });
    await t.step("with invalid value (spinner)", () => {
      const options = purifyPickerConfigOptions(name, {
        prompt: {
          spinner: 10,
        },
      });
      assertEquals(options.prompt, {});
    });
    await t.step("with valid value (spinner)", () => {
      const options = purifyPickerConfigOptions(name, {
        prompt: {
          spinner: ["A", "B", "C"],
        },
      });
      assertEquals(options.prompt, {
        spinner: ["A", "B", "C"],
      });
    });
    await t.step("with invalid value (headSymbol)", () => {
      const options = purifyPickerConfigOptions(name, {
        prompt: {
          headSymbol: 10,
        },
      });
      assertEquals(options.prompt, {});
    });
    await t.step("with valid value (headSymbol)", () => {
      const options = purifyPickerConfigOptions(name, {
        prompt: {
          headSymbol: "A",
        },
      });
      assertEquals(options.prompt, {
        headSymbol: "A",
      });
    });
    await t.step("with invalid value (failSymbol)", () => {
      const options = purifyPickerConfigOptions(name, {
        prompt: {
          failSymbol: 10,
        },
      });
      assertEquals(options.prompt, {});
    });
    await t.step("with valid value (failSymbol)", () => {
      const options = purifyPickerConfigOptions(name, {
        prompt: {
          failSymbol: "A",
        },
      });
      assertEquals(options.prompt, {
        failSymbol: "A",
      });
    });
  });

  await t.step("preview", async (t) => {
    await t.step("with invalid value", () => {
      const options = purifyPickerConfigOptions(name, { preview: 0 });
      assertFalse("preview" in options);
    });
    await t.step("with valid value (empty)", () => {
      const options = purifyPickerConfigOptions(name, { preview: {} });
      assertEquals(options.preview, {});
    });
    await t.step("with invalid value (debounceWait)", () => {
      const options = purifyPickerConfigOptions(name, {
        preview: {
          debounceWait: "invalid",
        },
      });
      assertEquals(options.preview, {});
    });
    await t.step("with valid value (debounceWait)", () => {
      const options = purifyPickerConfigOptions(name, {
        preview: {
          debounceWait: 10,
        },
      });
      assertEquals(options.preview, {
        debounceWait: 10,
      });
    });
  });

  await t.step("updateInterval", async (t) => {
    await t.step("with invalid value", () => {
      const options = purifyPickerConfigOptions(name, {
        updateInterval: "invalid",
      });
      assertFalse("updateInterval" in options);
    });
    await t.step("with valid value", () => {
      const options = purifyPickerConfigOptions(name, { updateInterval: 10 });
      assertEquals(options.updateInterval, 10);
    });
  });
});

Deno.test("purifySourcePickerConfig", async (t) => {
  const { purifySourcePickerConfig } = _internal;
  const name = "name";

  await t.step("with invalid value", () => {
    assertEquals(purifySourcePickerConfig(name, null), {});
    assertEquals(purifySourcePickerConfig(name, undefined), {});
    assertEquals(purifySourcePickerConfig(name, 1), {});
    assertEquals(purifySourcePickerConfig(name, "1"), {});
    assertEquals(purifySourcePickerConfig(name, true), {});
    assertEquals(purifySourcePickerConfig(name, []), {});
  });

  await t.step("actionAlias", async (t) => {
    await t.step("with invalid value", () => {
      const options = purifySourcePickerConfig(name, { actionAlias: 0 });
      assertFalse("actionAlias" in options);
    });
    await t.step("with invalid value (invalid type)", () => {
      const options = purifySourcePickerConfig(name, {
        actionAlias: {
          "a": 0,
        },
      });
      assertFalse("actionAlias" in options);
    });
    await t.step("with valid value (empty)", () => {
      const options = purifySourcePickerConfig(name, { actionAlias: {} });
      assertEquals(options.actionAlias, {});
    });
    await t.step("with valid value", () => {
      const options = purifySourcePickerConfig(name, {
        actionAlias: {
          "a": "A",
        },
      });
      assertEquals(options.actionAlias, {
        "a": "A",
      });
    });
  });

  await t.step("actions", async (t) => {
    await t.step("with invalid value", () => {
      const options = purifySourcePickerConfig(name, { actions: 0 });
      assertFalse("actions" in options);
    });
    await t.step("with invalid value (invalid type)", () => {
      const options = purifySourcePickerConfig(name, {
        actions: [0, 1, 2],
      });
      assertFalse("actions" in options);
    });
    await t.step("with valid value (empty)", () => {
      const options = purifySourcePickerConfig(name, { actions: [] });
      assertEquals(options.actions, []);
    });
    await t.step("with valid value", () => {
      const options = purifySourcePickerConfig(name, {
        actions: ["a", "b", "c"],
      });
      assertEquals(options.actions, ["a", "b", "c"]);
    });
  });

  await t.step("filters", async (t) => {
    await t.step("with invalid value", () => {
      const options = purifySourcePickerConfig(name, { filters: 0 });
      assertFalse("filters" in options);
    });
    await t.step("with invalid value (invalid type)", () => {
      const options = purifySourcePickerConfig(name, {
        filters: [0, 1, 2],
      });
      assertFalse("filters" in options);
    });
    await t.step("with valid value (empty)", () => {
      const options = purifySourcePickerConfig(name, { filters: [] });
      assertEquals(options.filters, []);
    });
    await t.step("with valid value", () => {
      const options = purifySourcePickerConfig(name, {
        filters: ["a", "b", "c"],
      });
      assertEquals(options.filters, ["a", "b", "c"]);
    });
  });

  await t.step("previewer", async (t) => {
    await t.step("with invalid value", () => {
      const options = purifySourcePickerConfig(name, { previewer: 0 });
      assertFalse("previewer" in options);
    });
    await t.step("with invalid value (invalid type)", () => {
      const options = purifySourcePickerConfig(name, {
        previewer: ["a", "b", "c"],
      });
      assertFalse("previewer" in options);
    });
    await t.step("with valid value", () => {
      const options = purifySourcePickerConfig(name, {
        previewer: "a",
      });
      assertEquals(options.previewer, "a");
    });
  });

  await t.step("renderers", async (t) => {
    await t.step("with invalid value", () => {
      const options = purifySourcePickerConfig(name, { renderers: 0 });
      assertFalse("renderers" in options);
    });
    await t.step("with invalid value (invalid type)", () => {
      const options = purifySourcePickerConfig(name, {
        renderers: [0, 1, 2],
      });
      assertFalse("renderers" in options);
    });
    await t.step("with valid value (empty)", () => {
      const options = purifySourcePickerConfig(name, { renderers: [] });
      assertEquals(options.renderers, []);
    });
    await t.step("with valid value", () => {
      const options = purifySourcePickerConfig(name, {
        renderers: ["a", "b", "c"],
      });
      assertEquals(options.renderers, ["a", "b", "c"]);
    });
  });

  await t.step("sorters", async (t) => {
    await t.step("with invalid value", () => {
      const options = purifySourcePickerConfig(name, { sorters: 0 });
      assertFalse("sorters" in options);
    });
    await t.step("with invalid value (invalid type)", () => {
      const options = purifySourcePickerConfig(name, {
        sorters: [0, 1, 2],
      });
      assertFalse("sorters" in options);
    });
    await t.step("with valid value (empty)", () => {
      const options = purifySourcePickerConfig(name, { sorters: [] });
      assertEquals(options.sorters, []);
    });
    await t.step("with valid value", () => {
      const options = purifySourcePickerConfig(name, {
        sorters: ["a", "b", "c"],
      });
      assertEquals(options.sorters, ["a", "b", "c"]);
    });
  });

  await t.step("options", async (t) => {
    await t.step("with invalid value", () => {
      const options = purifySourcePickerConfig(name, { options: 0 });
      assertFalse("options" in options);
    });
    await t.step("with valid value", () => {
      const options = purifySourcePickerConfig(name, {
        options: {},
      });
      assertEquals(options.options, {});
    });
  });
});

Deno.test("purifyActionPickerConfig", async (t) => {
  const { purifyActionPickerConfig } = _internal;

  await t.step("with invalid value", () => {
    assertEquals(purifyActionPickerConfig(null), {});
    assertEquals(purifyActionPickerConfig(undefined), {});
    assertEquals(purifyActionPickerConfig(1), {});
    assertEquals(purifyActionPickerConfig("1"), {});
    assertEquals(purifyActionPickerConfig(true), {});
    assertEquals(purifyActionPickerConfig([]), {});
  });

  await t.step("filters", async (t) => {
    await t.step("with invalid value", () => {
      const options = purifyActionPickerConfig({ filters: 0 });
      assertFalse("filters" in options);
    });
    await t.step("with invalid value (invalid type)", () => {
      const options = purifyActionPickerConfig({
        filters: [0, 1, 2],
      });
      assertFalse("filters" in options);
    });
    await t.step("with valid value (empty)", () => {
      const options = purifyActionPickerConfig({ filters: [] });
      assertEquals(options.filters, []);
    });
    await t.step("with valid value", () => {
      const options = purifyActionPickerConfig({
        filters: ["a", "b", "c"],
      });
      assertEquals(options.filters, ["a", "b", "c"]);
    });
  });

  await t.step("previewer", async (t) => {
    await t.step("with invalid value", () => {
      const options = purifyActionPickerConfig({ previewer: 0 });
      assertFalse("previewer" in options);
    });
    await t.step("with invalid value (invalid type)", () => {
      const options = purifyActionPickerConfig({
        previewer: ["a", "b", "c"],
      });
      assertFalse("previewer" in options);
    });
    await t.step("with valid value", () => {
      const options = purifyActionPickerConfig({
        previewer: "a",
      });
      assertEquals(options.previewer, "a");
    });
  });

  await t.step("renderers", async (t) => {
    await t.step("with invalid value", () => {
      const options = purifyActionPickerConfig({ renderers: 0 });
      assertFalse("renderers" in options);
    });
    await t.step("with invalid value (invalid type)", () => {
      const options = purifyActionPickerConfig({
        renderers: [0, 1, 2],
      });
      assertFalse("renderers" in options);
    });
    await t.step("with valid value (empty)", () => {
      const options = purifyActionPickerConfig({ renderers: [] });
      assertEquals(options.renderers, []);
    });
    await t.step("with valid value", () => {
      const options = purifyActionPickerConfig({
        renderers: ["a", "b", "c"],
      });
      assertEquals(options.renderers, ["a", "b", "c"]);
    });
  });

  await t.step("sorters", async (t) => {
    await t.step("with invalid value", () => {
      const options = purifyActionPickerConfig({ sorters: 0 });
      assertFalse("sorters" in options);
    });
    await t.step("with invalid value (invalid type)", () => {
      const options = purifyActionPickerConfig({
        sorters: [0, 1, 2],
      });
      assertFalse("sorters" in options);
    });
    await t.step("with valid value (empty)", () => {
      const options = purifyActionPickerConfig({ sorters: [] });
      assertEquals(options.sorters, []);
    });
    await t.step("with valid value", () => {
      const options = purifyActionPickerConfig({
        sorters: ["a", "b", "c"],
      });
      assertEquals(options.sorters, ["a", "b", "c"]);
    });
  });

  await t.step("options", async (t) => {
    await t.step("with invalid value", () => {
      const options = purifyActionPickerConfig({ options: 0 });
      assertFalse("options" in options);
    });
    await t.step("with valid value", () => {
      const options = purifyActionPickerConfig({
        options: {},
      });
      assertEquals(options.options, {});
    });
  });
});

Deno.test("purifyPickerConfig", async (t) => {
  const { purifyPickerConfig } = _internal;

  await t.step("with invalid value", () => {
    assertEquals(purifyPickerConfig(null), {});
    assertEquals(purifyPickerConfig(undefined), {});
    assertEquals(purifyPickerConfig(1), {});
    assertEquals(purifyPickerConfig("1"), {});
    assertEquals(purifyPickerConfig(true), {});
    assertEquals(purifyPickerConfig([]), {});
  });

  await t.step("source", async (t) => {
    await t.step("with invalid value", () => {
      const options = purifyPickerConfig({ source: 0 });
      assertFalse("source" in options);
    });
    await t.step("with valid value", () => {
      const options = purifyPickerConfig({
        source: {},
      });
      assertEquals(options.source, {});
    });
  });

  await t.step("action", async (t) => {
    await t.step("with invalid value", () => {
      const options = purifyPickerConfig({ action: 0 });
      assertFalse("action" in options);
    });
    await t.step("with valid value", () => {
      const options = purifyPickerConfig({
        action: {},
      });
      assertEquals(options.action, {});
    });
  });
});
