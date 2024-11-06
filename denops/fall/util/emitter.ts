import type { Denops } from "jsr:@denops/std@^7.3.0";
import { emit } from "jsr:@denops/std@^7.3.0/autocmd";

/**
 * Save current cmap and emit `User FillPickerEnter:{name}` autocmd.
 *
 * The saved cmap will be restored by `emitPickerLeave`.
 */
export async function emitPickerEnter(
  denops: Denops,
  name: string,
): Promise<void> {
  try {
    await emit(denops, "User", `FillPickerEnter:${name}`, { nomodeline: true });
  } catch (err) {
    console.warn(`[fall] Failed to emit FallPickerEnter:${name}`, err);
  }
}

/**
 * Restore saved cmap and emit `User FillPickerLeave:{name}` autocmd.
 */
export async function emitPickerLeave(
  denops: Denops,
  name: string,
): Promise<void> {
  try {
    await emit(denops, "User", `FillPickerLeave:${name}`, { nomodeline: true });
  } catch (err) {
    console.warn(`[fall] Failed to emit FallPickerLeave:${name}`, err);
  }
}
