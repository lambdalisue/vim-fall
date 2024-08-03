import { AsyncDisposableStack, DisposableStack } from "jsr:@nick/dispose@^1.1.0";

// DisposableStack and AsyncDisposableStack are not available yet.
// https://github.com/denoland/deno/issues/20821

// deno-lint-ignore no-explicit-any
(globalThis as any).DisposableStack ??= DisposableStack;
// deno-lint-ignore no-explicit-any
(globalThis as any).AsyncDisposableStack ??= AsyncDisposableStack;

// Support BigInt in JSON.stringify()
declare global {
  interface BigInt {
    toJSON(): string;
  }
}
if (BigInt.prototype.toJSON === undefined) {
  Object.defineProperty(BigInt.prototype, "toJSON", {
    value() {
      return this.toString();
    },
    configurable: true,
    enumerable: false,
    writable: true,
  });
}
