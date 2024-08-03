import { assertEquals } from "jsr:@std/assert@^0.225.1";
import { delay } from "jsr:@std/async@^0.224.0/delay";
import { debounce } from "./debounce.ts";

Deno.test("debounce", async (t) => {
  // a--b--c--------d--e--f-----*
  // ==========|----==========|--
  // ----------c--------------f--
  // 0    5    1    1    2    2
  //           0    5    0    5
  await t.step("case1", async () => {
    const calls: string[] = [];
    const fn = debounce((v: string) => {
      calls.push(v);
    }, 30);

    fn("a");
    await delay(20);
    fn("b");
    await delay(20);
    fn("c");
    await delay(80);
    fn("d");
    await delay(20);
    fn("e");
    await delay(20);
    fn("f");
    await delay(50);
    assertEquals(calls, ["c", "f"]);
  });
});
