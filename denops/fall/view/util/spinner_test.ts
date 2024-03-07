import { assertEquals } from "https://deno.land/std@0.218.2/assert/mod.ts";
import { delay } from "https://deno.land/std@0.218.2/async/delay.ts";

import { ASCII_SPINNER, Spinner, UNICODE_SPINNER } from "./spinner.ts";

const UPDATE_INTERVAL = 10;

Deno.test("Spinner - next() returns the next spinner character", async () => {
  const spinner = new Spinner(UNICODE_SPINNER, UPDATE_INTERVAL);

  for (let i = 0; i < UNICODE_SPINNER.length; i++) {
    assertEquals(spinner.next(), UNICODE_SPINNER[i]);
    await delay(UPDATE_INTERVAL * 1.5);
  }
});

Deno.test("Spinner - next() returns the next spinner character with custom spinner", async () => {
  const spinner = new Spinner(ASCII_SPINNER, UPDATE_INTERVAL);

  for (let i = 0; i < ASCII_SPINNER.length; i++) {
    assertEquals(spinner.next(), ASCII_SPINNER[i]);
    await delay(UPDATE_INTERVAL * 1.5);
  }
});

Deno.test("Spinner - handles custom update interval", async () => {
  const updateInterval = 200; // milliseconds
  const spinner = new Spinner(UNICODE_SPINNER, UPDATE_INTERVAL);

  assertEquals(spinner.next(), UNICODE_SPINNER[0]);

  // Wait for more than the custom update interval
  await delay(updateInterval * 1.5);

  assertEquals(spinner.next(), UNICODE_SPINNER[1]); // Should have updated to the next character
});
