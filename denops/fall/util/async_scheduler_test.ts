import { delay } from "https://deno.land/std@0.218.2/async/mod.ts";
import { assertEquals } from "https://deno.land/std@0.218.2/assert/mod.ts";
import { startAsyncScheduler } from "./async_scheduler.ts";

Deno.test("startAsyncScheduler", async (t) => {
  await t.step(
    "calls the given asynchronous callback function with the given interval without overlapping",
    async () => {
      const controller = new AbortController();
      const { signal } = controller;
      let count = 0;
      let locked = false;
      {
        using _disposable = startAsyncScheduler(async () => {
          if (locked) {
            throw new Error("Overlapping");
          }
          locked = true;
          await delay(100, { signal });
          count++;
          locked = false;
        }, 100);
        await delay(900);
      }
      controller.abort();
      // ```
      // Count             1                   2                   3                   4
      // -------->=========|--------->=========|--------->=========|--------->=========|---------x
      // Time    100       200       300       400       500       600       700       800       900
      // ```
      assertEquals(count, 4);
    },
  );

  await t.step(
    "stops when the callback throws an error",
    async () => {
      let count = 0;
      {
        using _disposable = startAsyncScheduler(
          () => {
            count++;
            throw new Error("Error");
          },
          100,
        );
        await delay(500);
      }
      // ```
      // Count   1
      // --------x........................................
      // Time    100       200       300       400       500
      // ```
      assertEquals(count, 1);
    },
  );

  await t.step(
    "does not call the given asynchronous callback function if the signal is already aborted",
    async () => {
      const controller = new AbortController();
      const { signal } = controller;
      controller.abort();
      let count = 0;
      {
        using _disposable = startAsyncScheduler(
          () => {
            count++;
            return Promise.resolve();
          },
          100,
          { signal },
        );
        await delay(200);
      }
      // ```
      // Count
      // ...................
      // Time    100       200
      // ```
      assertEquals(count, 0);
    },
  );

  await t.step(
    "does not call the given asynchronous callback function after the signal is aborted",
    async () => {
      const controller = new AbortController();
      const { signal } = controller;
      let count = 0;
      {
        using _disposable = startAsyncScheduler(
          () => {
            count++;
            return Promise.resolve();
          },
          100,
          { signal },
        );
        await delay(250);
        controller.abort();
        await delay(250);
      }
      // ```
      // Count   1         2
      // --------|---------|----x.........................
      // Time    100       200       300       400       500
      // ```
      assertEquals(count, 2);
    },
  );
});
