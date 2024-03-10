import type { Denops } from "https://deno.land/x/denops_std@v6.3.0/mod.ts";
import { g } from "https://deno.land/x/denops_std@v6.3.0/variable/mod.ts";
import { batch } from "https://deno.land/x/denops_std@v6.3.0/batch/mod.ts";
import * as autocmd from "https://deno.land/x/denops_std@v6.3.0/autocmd/mod.ts";
import * as buffer from "https://deno.land/x/denops_std@v6.3.0/buffer/mod.ts";
import * as opt from "https://deno.land/x/denops_std@v6.3.0/option/mod.ts";
import { dirname } from "https://deno.land/std@0.219.0/path/mod.ts";
import { ensureDir, exists } from "https://deno.land/std@0.219.0/fs/mod.ts";

import {
  defaultConfig as defaultPickerConfig,
  loadPickerConfig,
} from "./config/picker.ts";
import {
  defaultConfig as defaultExtensionConfig,
  loadExtensionConfig,
} from "./config/extension.ts";
import {
  defaultConfig as defaultRegistryConfig,
  loadRegistryConfig,
} from "./config/registry.ts";

export async function editPickerConfig(
  denops: Denops,
): Promise<void> {
  const path = await getPickerConfigPath(denops);
  await ensureDir(dirname(path));
  if (!await exists(path)) {
    await Deno.writeTextFile(
      path,
      JSON.stringify(defaultPickerConfig, null, 2),
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

export async function editExtensionConfig(
  denops: Denops,
): Promise<void> {
  const path = await getExtensionConfigPath(denops);
  await ensureDir(dirname(path));
  if (!await exists(path)) {
    await Deno.writeTextFile(
      path,
      JSON.stringify(defaultExtensionConfig, null, 2),
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

export async function editRegistryConfig(
  denops: Denops,
): Promise<void> {
  const path = await getRegistryConfigPath(denops);
  await ensureDir(dirname(path));
  if (!await exists(path)) {
    await Deno.writeTextFile(
      path,
      JSON.stringify(defaultRegistryConfig, null, 2),
    );
  }
  await buffer.open(denops, path);
  await batch(denops, async (denops) => {
    await opt.autochdir.set(denops, false);
    await opt.bufhidden.set(denops, "wipe");
  });
  await autocmd.group(denops, "fall_registry_config_edit", (helper) => {
    helper.remove("*", "<buffer>");
    helper.define(
      "BufWritePost",
      "<buffer>",
      `call denops#notify('${denops.name}', 'reloadConfig', ['registry'])`,
    );
  });
}

export async function reloadPickerConfig(denops: Denops): Promise<void> {
  const path = await getPickerConfigPath(denops);
  try {
    await loadPickerConfig(path);
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      return;
    }
    throw err;
  }
}

export async function reloadExtensionConfig(denops: Denops): Promise<void> {
  const path = await getExtensionConfigPath(denops);
  try {
    await loadExtensionConfig(path);
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      return;
    }
    throw err;
  }
}

export async function reloadRegistryConfig(denops: Denops): Promise<void> {
  const path = await getRegistryConfigPath(denops);
  try {
    await loadRegistryConfig(path);
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      return;
    }
    throw err;
  }
}

function getPickerConfigPath(denops: Denops): Promise<string> {
  return g.get(denops, "fall_picker_config_path");
}

function getExtensionConfigPath(denops: Denops): Promise<string> {
  return g.get(denops, "fall_extension_config_path");
}

function getRegistryConfigPath(denops: Denops): Promise<string> {
  return g.get(denops, "fall_registry_config_path");
}
