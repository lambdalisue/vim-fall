import type { Denops } from "jsr:@denops/std@^7.3.0";

import { refineActionPicker } from "./config/action_picker.ts";
import { refineGlobalConfig } from "./config/global_config.ts";
import {
  defineItemPickerFromCurator,
  defineItemPickerFromSource,
} from "./config/item_picker.ts";

export { getGlobalConfig } from "./config/global_config.ts";
export { getActionPickerParams } from "./config/action_picker.ts";
export {
  getItemPickerParams,
  listItemPickerNames,
} from "./config/item_picker.ts";

export async function loadUserConfig(
  denops: Denops,
  path: string,
): Promise<void> {
  const ctx = {
    denops,
    defineItemPickerFromSource,
    defineItemPickerFromCurator,
    refineActionPicker,
    refineGlobalConfig,
  };
  try {
    const { main } = await import(path);
    await main(ctx);
  } catch (e) {
    console.warn(
      `Failed to load user config. Fallback to the default config: ${e}`,
    );
    const { main } = await import(
      new URL("./_assets/default.config.ts", import.meta.url).href
    );
    await main(ctx);
  }
}
