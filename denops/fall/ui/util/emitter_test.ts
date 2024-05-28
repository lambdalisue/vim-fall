import { assertEquals } from "jsr:@std/assert@0.225.1";
import { DenopsStub } from "https://deno.land/x/denops_test@v1.6.2/mod.ts";

import { emitPickerEnter, emitPickerLeave } from "./emitter.ts";

Deno.test("emitPickerEnter", async (t) => {
  await t.step("invoke 'fall#internal#mapping#store'", async () => {
    const called: [string, unknown[]][] = [];
    const denops = new DenopsStub({
      call(name, ...args): Promise<unknown> {
        called.push([name, args]);
        return Promise.resolve();
      },
    });
    await emitPickerEnter(denops, "test");
    assertEquals(called, [
      ["fall#internal#mapping#store", []],
    ]);
  });

  await t.step("emit 'User FallPickerEnter:{name}'", async () => {
    const called: [string, Record<PropertyKey, unknown>][] = [];
    const denops = new DenopsStub({
      cmd(name, ctx): Promise<void> {
        called.push([name, ctx]);
        return Promise.resolve();
      },
    });
    await emitPickerEnter(denops, "test");
    assertEquals(called, [
      ["do <nomodeline> User FallPickerEnter:test", {}],
    ]);
  });
});

Deno.test("emitPickerLeave", async (t) => {
  await t.step("invoke 'fall#internal#mapping#restore'", async () => {
    const called: [string, unknown[]][] = [];
    const denops = new DenopsStub({
      call(name, ...args): Promise<unknown> {
        called.push([name, args]);
        return Promise.resolve();
      },
    });
    await emitPickerLeave(denops, "test");
    assertEquals(called, [
      ["fall#internal#mapping#restore", []],
    ]);
  });

  await t.step("emit 'User FallPickerLeave:{name}'", async () => {
    const called: [string, Record<PropertyKey, unknown>][] = [];
    const denops = new DenopsStub({
      cmd(name, ctx): Promise<void> {
        called.push([name, ctx]);
        return Promise.resolve();
      },
    });
    await emitPickerLeave(denops, "test");
    assertEquals(called, [
      ["do <nomodeline> User FallPickerLeave:test", {}],
    ]);
  });
});
