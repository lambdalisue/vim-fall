import type { Denops } from "https://deno.land/x/denops_std@v6.4.0/mod.ts";
import { collect } from "https://deno.land/x/denops_std@v6.4.0/batch/mod.ts";
import { g } from "https://deno.land/x/denops_std@v6.4.0/variable/mod.ts";
import { ensure, is } from "https://deno.land/x/unknownutil@v3.16.3/mod.ts";

import { assign } from "../const.ts";
import { loadExtensionConfig } from "../config/extension.ts";
import { loadPickerConfig } from "../config/picker.ts";

export function init(denops: Denops): Promise<void> {
  if (initWaiter) {
    return initWaiter;
  }
  initWaiter = (async () => {
    const [pickerConfigPath, extensionConfigPath] = await collect(
      denops,
      (denops) => [
        g.get(denops, "fall_picker_config_path"),
        g.get(denops, "fall_extension_config_path"),
      ],
    );
    assign({
      pickerConfigPath: ensure(pickerConfigPath, is.String),
      extensionConfigPath: ensure(extensionConfigPath, is.String),
    });
    await Promise.all([
      loadPickerConfig(),
      loadExtensionConfig(),
    ]);
  })();
  return initWaiter;
}

let initWaiter: Promise<void> | undefined;
