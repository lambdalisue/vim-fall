import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.218.2/assert/mod.ts";
import { dispatch, isFallEventName, subscribe } from "./event.ts";

Deno.test("subscribe and dispatch events", () => {
  let called = 0;
  const callback = (data: unknown) => {
    assertEquals(data, "test data");
    called += 1;
  };

  // Subscribe to an event
  const disposable = subscribe("cmdline-changed", callback);

  // Dispatch the event
  dispatch("cmdline-changed", "test data");
  assertEquals(called, 1);

  // Dispose the subscription
  disposable[Symbol.dispose]();

  // Ensure that the callback is not called after disposal
  dispatch("cmdline-changed", "test data");
  assertEquals(called, 1);
});

Deno.test("isFallEventName function", () => {
  // Test with a valid fall event name
  assert(isFallEventName("cmdline-changed"));

  // Test with an invalid fall event name
  assert(!isFallEventName("invalid-event-name"));
});
