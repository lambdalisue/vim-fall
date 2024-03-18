import type { Denops } from "https://deno.land/x/denops_std@v6.4.0/mod.ts";
import { batch } from "https://deno.land/x/denops_std@v6.4.0/batch/mod.ts";
import { g } from "https://deno.land/x/denops_std@v6.4.0/variable/mod.ts";
import * as autocmd from "https://deno.land/x/denops_std@v6.4.0/autocmd/mod.ts";
import * as buffer from "https://deno.land/x/denops_std@v6.4.0/buffer/mod.ts";
import * as opt from "https://deno.land/x/denops_std@v6.4.0/option/mod.ts";
import { deepMerge } from "https://deno.land/std@0.219.0/collections/deep_merge.ts";
import { dirname } from "https://deno.land/std@0.219.0/path/mod.ts";
import {
  copy,
  ensureDir,
  exists,
} from "https://deno.land/std@0.219.0/fs/mod.ts";
import { is, maybe } from "https://deno.land/x/unknownutil@v3.16.3/mod.ts";

import {
  type ActionPickerConfig,
  loadPickerConfig,
  type PickerConfig,
  type SourcePickerConfig,
} from "../config/picker.ts";
import {
  type ExtensionConfig,
  loadExtensionConfig,
} from "../config/extension.ts";

export function getExtensionConfig(): ExtensionConfig {
  return deepMerge(builtinExtensionConfig, customExtensionConfig, {
    arrays: "replace",
  });
}

export function getPickerConfig(): PickerConfig {
  return deepMerge(builtinPickerConfig, customPickerConfig, {
    arrays: "replace",
  });
}

export function getActionPickerConfig(): ActionPickerConfig {
  return getPickerConfig().action ?? {};
}

export function getSourcePickerConfig(expr: string): SourcePickerConfig {
  const sconf = getPickerConfig().source ?? {};
  const dconf = sconf[""] ?? {};
  const rconf = sconf[expr.split(":", 1)[0]] ?? {};
  const vconf = sconf[expr] ?? {};
  return deepMerge(deepMerge(dconf, rconf, { arrays: "replace" }), vconf, {
    arrays: "replace",
  });
}

export async function getExtensionConfigPath(
  denops: Denops,
): Promise<string | undefined> {
  const path = maybe(
    await g.get(denops, "fall_extension_config_path"),
    is.String,
  );
  if (path == undefined) {
    console.warn(
      `[fall] The 'g:fall_extension_config_path' variable is not valid string.`,
    );
  }
  return path;
}

export async function getPickerConfigPath(
  denops: Denops,
): Promise<string | undefined> {
  const path = maybe(
    await g.get(denops, "fall_picker_config_path"),
    is.String,
  );
  if (path == undefined) {
    console.warn(
      `[fall] The 'g:fall_picker_config_path' variable is not valid string.`,
    );
  }
  return path;
}

export async function reloadExtensionConfig(
  denops: Denops,
): Promise<void> {
  const path = await getExtensionConfigPath(denops);
  if (!path) {
    console.warn(
      `[fall] Skip loading the user extension config.`,
    );
    customExtensionConfig = {};
    return;
  }
  try {
    customExtensionConfig = await loadExtensionConfig(path);
  } catch (err) {
    if (!(err instanceof Deno.errors.NotFound)) {
      console.warn(
        `[fall] Failed to load extension config "${path}": ${err}`,
      );
    }
    customExtensionConfig = {};
  }
}

export async function reloadPickerConfig(
  denops: Denops,
): Promise<void> {
  const path = await getPickerConfigPath(denops);
  if (!path) {
    console.warn(
      `[fall] Skip loading the user picker config.`,
    );
    customPickerConfig = {};
    return;
  }
  try {
    customPickerConfig = await loadPickerConfig(path);
  } catch (err) {
    if (!(err instanceof Deno.errors.NotFound)) {
      console.warn(
        `[fall] Failed to load "${path}": ${err}`,
      );
    }
    customPickerConfig = {};
  }
}

export async function editExtensionConfig(
  denops: Denops,
): Promise<void> {
  const path = await getExtensionConfigPath(denops);
  if (!path) {
    console.error(
      `[fall] Failed to open user extension config.`,
    );
    return;
  }
  await ensureDir(dirname(path));
  if (!await exists(path)) {
    await copy(
      new URL("../assets/extension-config.default.json", import.meta.url),
      path,
    );
  }
  await buffer.open(denops, path);
  await batch(denops, async (denops) => {
    await opt.autochdir.set(denops, false);
    await opt.bufhidden.set(denops, "wipe");
  });
  await autocmd.group(denops, "fall_extension_config_edit", (helper) => {
    helper.remove("*", "<buffer>");
    helper.define(
      "BufWritePost",
      "<buffer>",
      `call denops#notify('${denops.name}', 'reloadConfig', ['extension'])`,
    );
  });
}

export async function editPickerConfig(
  denops: Denops,
): Promise<void> {
  const path = await getPickerConfigPath(denops);
  if (!path) {
    console.error(
      `[fall] Failed to open user picker config.`,
    );
    return;
  }
  await ensureDir(dirname(path));
  if (!await exists(path)) {
    await copy(
      new URL("../assets/picker-config.default.json", import.meta.url),
      path,
    );
  }
  await buffer.open(denops, path);
  await batch(denops, async (denops) => {
    await opt.autochdir.set(denops, false);
    await opt.bufhidden.set(denops, "wipe");
  });
  await autocmd.group(denops, "fall_picker_config_edit", (helper) => {
    helper.remove("*", "<buffer>");
    helper.define(
      "BufWritePost",
      "<buffer>",
      `call denops#notify('${denops.name}', 'reloadConfig', ['picker'])`,
    );
  });
}

const builtinExtensionConfig: ExtensionConfig = await loadExtensionConfig(
  new URL("../assets/extension-config.builtin.json", import.meta.url),
);
const builtinPickerConfig: PickerConfig = await loadPickerConfig(
  new URL("../assets/picker-config.builtin.json", import.meta.url),
);

let customExtensionConfig: ExtensionConfig = {};
let customPickerConfig: PickerConfig = {};
