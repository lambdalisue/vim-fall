import { delay } from "jsr:@std/async@^1.0.7";
import { assertEquals } from "jsr:@std/assert@^1.0.6";
import { Scheduler } from "./scheduler.ts";

Deno.test("Scheduler", async (t) => {
  await t.step(
    "calls the given asynchronous callback function with the given interval without overlapping",
    async () => {
      const controller = new AbortController();
      const { signal } = controller;
      let count = 0;
      let locked = false;
      {
        using scheduler = new Scheduler(100);
        scheduler.start(async () => {
          if (locked) {
            throw new Error("Overlapping");
          }
          locked = true;
          await delay(100, { signal });
          count++;
          locked = false;
        });
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
        using scheduler = new Scheduler(100);
        scheduler.start(() => {
          count++;
          throw new Error("Error");
        });
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
        using scheduler = new Scheduler(100);
        scheduler.start(() => {
          count++;
          return Promise.resolve();
        }, { signal });
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
        using scheduler = new Scheduler(100);
        scheduler.start(() => {
          count++;
          return Promise.resolve();
        }, { signal });
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
