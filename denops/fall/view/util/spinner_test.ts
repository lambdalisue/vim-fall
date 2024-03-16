import { assertEquals } from "https://deno.land/std@0.218.2/assert/mod.ts";
import { delay } from "https://deno.land/std@0.218.2/async/delay.ts";

import { Spinner, UNICODE_SPINNER } from "./spinner.ts";

const UPDATE_INTERVAL = 10;

Deno.test("Spinner", async (t) => {
  await t.step(
    "next() returns the next spinner character after the interval",
    async () => {
      using spinner = new Spinner(UNICODE_SPINNER, UPDATE_INTERVAL);

      for (let i = 0; i < UNICODE_SPINNER.length; i++) {
        assertEquals(
          spinner.next(),
          UNICODE_SPINNER[(i + 1) % UNICODE_SPINNER.length],
        );
        await delay(UPDATE_INTERVAL * 1.5);
      }
    },
  );

  await t.step(
    "next() returns same character within the interval",
    () => {
      using spinner = new Spinner(UNICODE_SPINNER, 1000);

      const char = spinner.next();
      for (let i = 0; i < UNICODE_SPINNER.length; i++) {
        assertEquals(spinner.next(), char);
      }
    },
  );
});
