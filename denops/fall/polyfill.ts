import {
  AsyncDisposableStack,
  DisposableStack,
} from "https://deno.land/x/dispose@1.0.1/mod.ts";

// DisposableStack and AsyncDisposableStack are not available yet.
// https://github.com/denoland/deno/issues/20821

// deno-lint-ignore no-explicit-any
(globalThis as any).DisposableStack ??= DisposableStack;
// deno-lint-ignore no-explicit-any
(globalThis as any).AsyncDisposableStack ??= AsyncDisposableStack;
