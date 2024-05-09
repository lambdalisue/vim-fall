import { assertEquals } from "jsr:@std/assert@0.225.1";
import { withSideEffect } from "./with_side_effect.ts";

Deno.test("withSideEffect should execute the side effect and return the value", () => {
  let sideEffectExecuted = false;
  const effect = () => {
    sideEffectExecuted = true;
  };

  const value = "test value";
  const result = withSideEffect(value, effect);

  assertEquals(result, value);
  assertEquals(sideEffectExecuted, true);
});
