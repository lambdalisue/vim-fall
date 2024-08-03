import { assertEquals } from "jsr:@std/assert@^1.0.0";

import type { Item, Projector } from "../extension/mod.ts";
import { subscribe } from "../util/event.ts";
import { ItemProjector } from "./item_projector.ts";

const testProjectors: Projector[] = [
  {
    name: "filter",
    project({ items, query }, { signal }) {
      return items.filter((v) => {
        signal?.throwIfAborted();
        if (v.detail.error) {
          throw v.detail.error;
        }
        return v.value.includes(query);
      });
    },
  },
  {
    name: "sort",
    project({ items }, { signal }) {
      return items.toSorted((a, b) => {
        signal?.throwIfAborted();
        return -1 * a.value.localeCompare(b.value);
      });
    },
  },
];

Deno.test("ItemProjector", async (t) => {
  const controller = new AbortController();
  const { signal } = controller;

  await t.step("projects items with given query", async () => {
    const { promise, resolve } = Promise.withResolvers<void>();
    using _ = subscribe("item-projector-completed", () => resolve());
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
    await using projector = new ItemProjector({
      projectors: testProjectors,
    });
    projector.start({ items, query: "2" }, { signal });
    await promise;
    assertEquals(projector.items, [
      { id: "8", value: "32", detail: {}, decorations: [] },
      { id: "6", value: "23", detail: {}, decorations: [] },
      { id: "5", value: "22", detail: {}, decorations: [] },
      { id: "4", value: "21", detail: {}, decorations: [] },
      { id: "2", value: "12", detail: {}, decorations: [] },
    ]);
  });

  await t.step("dispatch 'item-projector-succeeded' on success", async () => {
    const { promise, resolve } = Promise.withResolvers<void>();
    let called = false;
    using _a = subscribe("item-projector-completed", () => resolve());
    using _b = subscribe("item-projector-succeeded", () => called = true);
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
    await using projector = new ItemProjector({
      projectors: testProjectors,
    });
    projector.start({ items, query: "2" }, { signal });
    await promise;
    assertEquals(called, true);
  });

  await t.step("dispatch 'item-projector-failed' on failure", async () => {
    const { promise, resolve } = Promise.withResolvers<void>();
    let called = false;
    using _a = subscribe("item-projector-completed", () => resolve());
    using _b = subscribe("item-projector-failed", () => called = true);
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
    await using projector = new ItemProjector({
      projectors: testProjectors,
    });
    projector.start({ items, query: "2" }, { signal });
    await promise;
    assertEquals(called, true);
  });
});
