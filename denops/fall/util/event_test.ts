import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import { dispatch, isFallEventName, subscribe } from "./event.ts";

Deno.test("subscribe and dispatch events", () => {
  // Subscribe "cmdline-changed" event
  let called1: string = "";
  let called2: string = "";
  using disposable1 = subscribe("cmdline-changed", (cmdline) => {
    called1 = cmdline;
  });
  using _disposable2 = subscribe("cmdline-changed", (cmdline) => {
    called2 = cmdline;
  });

  // Dispatch the event
  dispatch("cmdline-changed", "test data");
  assertEquals(called1, "test data");
  assertEquals(called2, "test data");

  // Dispose the subscription
  disposable1[Symbol.dispose]();

  // Ensure that the callback is not called after disposal
  dispatch("cmdline-changed", "test data2");
  assertEquals(called1, "test data");
  assertEquals(called2, "test data2");
});

Deno.test("isFallEventName", async (t) => {
  await t.step("returns true for a valid fall event name", () => {
    // Test with a valid fall event name
    assert(isFallEventName("cmdline-changed"));
  });

  await t.step("returns false for an invalid fall event name", () => {
    // Test with an invalid fall event name
    assert(!isFallEventName("invalid-event-name"));
  });
});
