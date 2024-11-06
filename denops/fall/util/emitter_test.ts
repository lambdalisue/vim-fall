import { assertEquals } from "jsr:@std/assert@^1.0.6";
import { DenopsStub } from "jsr:@denops/test@^3.0.4/stub";

import { emitPickerEnter, emitPickerLeave } from "./emitter.ts";

Deno.test("emitPickerEnter", async (t) => {
  await t.step("emit 'User FillPickerEnter:{name}'", async () => {
    const called: [string, Record<PropertyKey, unknown>][] = [];
    const denops = new DenopsStub({
      cmd(name, ctx): Promise<void> {
        called.push([name, ctx]);
        return Promise.resolve();
      },
    });
    await emitPickerEnter(denops, "test");
    assertEquals(called, [
      ["do <nomodeline> User FillPickerEnter:test", {}],
    ]);
  });
});

Deno.test("emitPickerLeave", async (t) => {
  await t.step("emit 'User FillPickerLeave:{name}'", async () => {
    const called: [string, Record<PropertyKey, unknown>][] = [];
    const denops = new DenopsStub({
      cmd(name, ctx): Promise<void> {
        called.push([name, ctx]);
        return Promise.resolve();
      },
    });
    await emitPickerLeave(denops, "test");
    assertEquals(called, [
      ["do <nomodeline> User FillPickerLeave:test", {}],
    ]);
  });
});
