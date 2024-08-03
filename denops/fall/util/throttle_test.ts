import { assertEquals } from "jsr:@std/assert@^0.225.1";
import { delay } from "jsr:@std/async@^0.224.0/delay";
import { throttle } from "./throttle.ts";

Deno.test("throttle", async (t) => {
  // a-----b-----c-----d-----e-----f-----*
  // |-----------|-----------|-----------|
  // a-----------c-----------e-----------f
  // 0    5    1    1    2    2
  //           0    5    0    5
  await t.step("case1", async () => {
    const calls: string[] = [];
    const fn = throttle((v: string) => {
      calls.push(v);
    }, 110);

    const values = "abcdef".split("");
    for (const value of values) {
      fn(value);
      await delay(50);
    }
    await delay(50);
    assertEquals(calls, ["a", "c", "e", "f"]);
  });

  // a-----b-----c-----d-----e-----f-----*
  // |----------|----------|----------|---
  // a----------b----------d----------f---
  // 0    5    1    1    2    2
  //           0    5    0    5
  await t.step("case2", async () => {
    const calls: string[] = [];
    const fn = throttle((v: string) => {
      calls.push(v);
    }, 100);

    const values = "abcdef".split("");
    for (const value of values) {
      fn(value);
      await delay(50);
    }
    await delay(50);
    assertEquals(calls, ["a", "b", "d", "f"]);
  });
});
