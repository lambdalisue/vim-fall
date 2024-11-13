import { isObjectOf } from "jsr:@core/unknownutil@^4.3.0/is/object-of";
import { isSyncFunction } from "jsr:@core/unknownutil@^4.3.0/is/sync-function";
import { isAsyncFunction } from "jsr:@core/unknownutil@^4.3.0/is/async-function";

const isDisposable = isObjectOf({
  [Symbol.dispose]: isSyncFunction,
});

const isAsyncDisposable = isObjectOf({
  [Symbol.asyncDispose]: isAsyncFunction,
});

/**
 * Dispose the resource.
 *
 * It tries to call Symbol.dispose or Symbol.asyncDispose if the resource has
 * the method.
 */
export async function dispose(resource: unknown): Promise<void> {
  if (isDisposable(resource)) {
    resource[Symbol.dispose]();
  } else if (isAsyncDisposable(resource)) {
    await resource[Symbol.asyncDispose]();
  }
}
