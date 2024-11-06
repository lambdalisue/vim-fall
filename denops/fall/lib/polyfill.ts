import {
  AsyncDisposableStack,
  DisposableStack,
} from "jsr:@nick/dispose@^1.1.0";

// DisposableStack and AsyncDisposableStack are not available yet.
// https://github.com/denoland/deno/issues/20821

// deno-lint-ignore no-explicit-any
(globalThis as any).DisposableStack ??= DisposableStack;
// deno-lint-ignore no-explicit-any
(globalThis as any).AsyncDisposableStack ??= AsyncDisposableStack;
