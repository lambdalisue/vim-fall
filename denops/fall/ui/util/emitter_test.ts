import { assertEquals } from "jsr:@std/assert@^1.0.0";
import { DenopsStub } from "jsr:@denops/test@^3.0.1/stub";

import { emitPickerEnter, emitPickerLeave } from "./emitter.ts";

Deno.test("emitPickerEnter", async (t) => {
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
