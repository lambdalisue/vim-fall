import { assertEquals } from "jsr:@std/assert@^1.0.6";

import { consume, dispatch, type Event } from "./event.ts";

Deno.test("Event", async (t) => {
  await t.step("consume consumes dispatched events", () => {
    dispatch({ type: "vim-cmdline-changed", cmdline: "echo 'hello'" });
    dispatch({ type: "vim-cmdpos-changed", cmdpos: 10 });

    let dispatchedEvents: Event[] = [];
    consume((event) => {
      dispatchedEvents.push(event);
    });

    assertEquals(dispatchedEvents, [
      { type: "vim-cmdline-changed", cmdline: "echo 'hello'" },
      { type: "vim-cmdpos-changed", cmdpos: 10 },
    ]);

    dispatchedEvents = [];
    consume((event) => {
      dispatchedEvents.push(event);
    });
    assertEquals(dispatchedEvents, []);
  });
});
