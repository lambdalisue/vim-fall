import type { Denops } from "jsr:@denops/std@^7.0.0";
import { emit } from "jsr:@denops/std@^7.0.0/autocmd";

/**
 * Save current cmap and emit `User FallPickerEnter:{name}` autocmd.
 *
 * The saved cmap will be restored by `emitPickerLeave`.
 */
export async function emitPickerEnter(
  denops: Denops,
  name: string,
): Promise<void> {
  try {
    await emit(denops, "User", `FallPickerEnter:${name}`, { nomodeline: true });
  } catch (err) {
    console.warn(`[fall] Failed to emit FallPickerEnter:${name}`, err);
  }
}

/**
 * Restore saved cmap and emit `User FallPickerLeave:{name}` autocmd.
 */
export async function emitPickerLeave(
  denops: Denops,
  name: string,
): Promise<void> {
  try {
    await emit(denops, "User", `FallPickerLeave:${name}`, { nomodeline: true });
  } catch (err) {
    console.warn(`[fall] Failed to emit FallPickerLeave:${name}`, err);
  }
}
