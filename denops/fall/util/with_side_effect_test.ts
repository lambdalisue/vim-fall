import { assertEquals } from "https://deno.land/std@0.220.1/assert/mod.ts";
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
