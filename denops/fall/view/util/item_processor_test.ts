import { assertEquals } from "jsr:@std/assert@0.225.1";

import type { Item, Projector, Transformer } from "../../extension/type.ts";
import { subscribe } from "../../util/event.ts";
import { ItemProcessor } from "./item_processor.ts";

const testTransformers: Transformer[] = [
  {
    name: "testTransformer",
    transform({ query }) {
      return new TransformStream({
        transform(chunk, controller) {
          if (chunk.detail.error) {
            controller.error(chunk.detail.error);
          } else if (chunk.value.includes(query)) {
            controller.enqueue(chunk);
          }
        },
      });
    },
  },
];

const testProjectors: Projector[] = [
  {
    name: "textProjector",
    project({ items }) {
      return items.toSorted((a, b) => -1 * a.value.localeCompare(b.value));
    },
  },
];

Deno.test("ItemProcessor", async (t) => {
  const controller = new AbortController();
  const { signal } = controller;

  await t.step("process items with given query", async () => {
    const { promise, resolve } = Promise.withResolvers<void>();
    using _ = subscribe("item-processor-completed", () => resolve());
    const items: Item[] = [
      { id: "1", value: "11", detail: {}, decorations: [] },
      { id: "2", value: "12", detail: {}, decorations: [] },
      { id: "3", value: "13", detail: {}, decorations: [] },
      { id: "4", value: "21", detail: {}, decorations: [] },
      { id: "5", value: "22", detail: {}, decorations: [] },
      { id: "6", value: "23", detail: {}, decorations: [] },
      { id: "7", value: "31", detail: {}, decorations: [] },
      { id: "8", value: "32", detail: {}, decorations: [] },
      { id: "9", value: "33", detail: {}, decorations: [] },
    ];
    await using processor = new ItemProcessor(testTransformers, testProjectors);
    processor.start(items, "2", { signal });
    await promise;
    assertEquals(processor.items, [
      { id: "8", value: "32", detail: {}, decorations: [] },
      { id: "6", value: "23", detail: {}, decorations: [] },
      { id: "5", value: "22", detail: {}, decorations: [] },
      { id: "4", value: "21", detail: {}, decorations: [] },
      { id: "2", value: "12", detail: {}, decorations: [] },
    ]);
  });

  await t.step("dispatch 'item-processor-succeeded' on success", async () => {
    const { promise, resolve } = Promise.withResolvers<void>();
    let called = false;
    using _a = subscribe("item-processor-completed", () => resolve());
    using _b = subscribe("item-processor-succeeded", () => called = true);
    const items: Item[] = [
      { id: "1", value: "11", detail: {}, decorations: [] },
      { id: "2", value: "12", detail: {}, decorations: [] },
      { id: "3", value: "13", detail: {}, decorations: [] },
      { id: "4", value: "21", detail: {}, decorations: [] },
      { id: "5", value: "22", detail: {}, decorations: [] },
      { id: "6", value: "23", detail: {}, decorations: [] },
      { id: "7", value: "31", detail: {}, decorations: [] },
      { id: "8", value: "32", detail: {}, decorations: [] },
      { id: "9", value: "33", detail: {}, decorations: [] },
    ];
    await using processor = new ItemProcessor(testTransformers, testProjectors);
    processor.start(items, "2", { signal });
    await promise;
    assertEquals(called, true);
  });

  await t.step("dispatch 'item-processor-failed' on failure", async () => {
    const { promise, resolve } = Promise.withResolvers<void>();
    let called = false;
    using _a = subscribe("item-processor-completed", () => resolve());
    using _b = subscribe("item-processor-failed", () => called = true);
    const items: Item[] = [
      { id: "1", value: "11", detail: {}, decorations: [] },
      { id: "2", value: "12", detail: {}, decorations: [] },
      {
        id: "3",
        value: "13",
        detail: { error: new Error("Error") },
        decorations: [],
      },
      { id: "4", value: "21", detail: {}, decorations: [] },
      { id: "5", value: "22", detail: {}, decorations: [] },
      { id: "6", value: "23", detail: {}, decorations: [] },
      { id: "7", value: "31", detail: {}, decorations: [] },
      { id: "8", value: "32", detail: {}, decorations: [] },
      { id: "9", value: "33", detail: {}, decorations: [] },
    ];
    await using processor = new ItemProcessor(testTransformers, testProjectors);
    processor.start(items, "2", { signal });
    await promise;
    assertEquals(called, true);
  });
});
