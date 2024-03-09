import type { Denops } from "https://deno.land/x/denops_std@v6.3.0/mod.ts";
import { g } from "https://deno.land/x/denops_std@v6.3.0/variable/mod.ts";
import { batch } from "https://deno.land/x/denops_std@v6.3.0/batch/mod.ts";
import * as autocmd from "https://deno.land/x/denops_std@v6.3.0/autocmd/mod.ts";
import * as buffer from "https://deno.land/x/denops_std@v6.3.0/buffer/mod.ts";
import * as opt from "https://deno.land/x/denops_std@v6.3.0/option/mod.ts";
import { dirname } from "https://deno.land/std@0.219.0/path/mod.ts";
import { ensureDir, exists } from "https://deno.land/std@0.219.0/fs/mod.ts";

import { loadPickerConfig } from "./config/picker.ts";
import { loadExtensionConfig } from "./config/extension.ts";

const pickerConfigSchema =
  "https://vim-fall.github.io/jsonschema/v1/picker.schema.json";
const extensionConfigSchema =
  "https://vim-fall.github.io/jsonschema/v1/extension.schema.json";

export async function editPickerConfig(
  denops: Denops,
): Promise<void> {
  const path = await getPickerConfigPath(denops);
  await ensureDir(dirname(path));
  if (!await exists(path)) {
    await Deno.writeTextFile(
      path,
      JSON.stringify(
        {
          $schema: pickerConfigSchema,
          $version: "1",
        },
        null,
        2,
      ),
    );
  }
  await buffer.open(denops, path);
  await batch(denops, async (denops) => {
    await opt.autochdir.set(denops, false);
    await opt.bufhidden.set(denops, "wipe");
  });
  await autocmd.group(denops, "fall_config_edit", (helper) => {
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
      JSON.stringify(
        {
          $schema: extensionConfigSchema,
          $version: "1",
        },
        null,
        2,
      ),
    );
  }
  await buffer.open(denops, path);
  await batch(denops, async (denops) => {
    await opt.autochdir.set(denops, false);
    await opt.bufhidden.set(denops, "wipe");
  });
  await autocmd.group(denops, "fall_config_edit", (helper) => {
    helper.remove("*", "<buffer>");
    helper.define(
      "BufWritePost",
      "<buffer>",
      `call denops#notify('${denops.name}', 'reloadConfig', ['extension'])`,
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

function getPickerConfigPath(denops: Denops): Promise<string> {
  return g.get(denops, "fall_picker_config_path");
}

function getExtensionConfigPath(denops: Denops): Promise<string> {
  return g.get(denops, "fall_extension_config_path");
}
