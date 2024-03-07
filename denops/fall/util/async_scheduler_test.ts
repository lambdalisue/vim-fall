import { assertEquals } from "https://deno.land/std@0.218.2/assert/mod.ts";
import { AsyncScheduler, startAsyncScheduler } from "./async_scheduler.ts";

Deno.test("AsyncScheduler - start and stop", async () => {
  let counter = 0;

  // deno-lint-ignore require-await
  const callback = async () => {
    counter++;
  };

  const interval = 100; // milliseconds
  using scheduler = new AsyncScheduler(callback, interval);

  assertEquals(counter, 0);

  scheduler.start();
  await new Promise((resolve) => setTimeout(resolve, interval * 3)); // Wait for a few intervals

  scheduler[Symbol.dispose]();

  const initialCounter = counter;

  // Ensure that the counter hasn't changed after stopping
  await new Promise((resolve) => setTimeout(resolve, interval * 3));
  assertEquals(counter, initialCounter);
});

Deno.test("startAsyncScheduler - start and stop", async () => {
  let counter = 0;

  // deno-lint-ignore require-await
  const callback = async () => {
    counter++;
  };

  const interval = 100; // milliseconds
  using disposable = startAsyncScheduler(callback, interval);

  assertEquals(counter, 0);

  await new Promise((resolve) => setTimeout(resolve, interval * 3)); // Wait for a few intervals

  disposable[Symbol.dispose]();
  const initialCounter = counter;

  // Ensure that the counter hasn't changed after stopping
  await new Promise((resolve) => setTimeout(resolve, interval * 3));
  assertEquals(counter, initialCounter);
});
