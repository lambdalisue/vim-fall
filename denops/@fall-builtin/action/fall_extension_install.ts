/**
 * Install the selected extension(s) to the local environment.
 *
 * @module
 */
import type { Action } from "https://deno.land/x/fall_core@v0.6.0/mod.ts";
import { deepMerge } from "https://deno.land/std@0.218.2/collections/deep_merge.ts";
import { assert, is } from "https://deno.land/x/unknownutil@v3.16.3/mod.ts";

import { type ExtensionConfig } from "../../fall/config/extension.ts";
import { getExtensionConfigPath } from "../../fall/main/config.ts";
import { isExtensionDetail } from "../source/fall_catalog.ts";

const isOptions = is.StrictOf(is.PartialOf(is.ObjectOf({})));

export function getAction(
  options: Record<string, unknown>,
): Action {
  assert(options, isOptions);
  return {
    invoke: async (denops, { cursorItem, selectedItems }) => {
      const path = await getExtensionConfigPath(denops);
      if (!path) {
        console.error("[fall] The action could not be executed.");
        return false;
      }
      const items = selectedItems.length > 0
        ? selectedItems
        : cursorItem
        ? [cursorItem]
        : [];
      const econf: ExtensionConfig = {};
      const urls: string[] = [];
      for (const item of items) {
        if (!isExtensionDetail(item.detail)) {
          continue;
        }
        const m = econf[item.detail.kind] ?? {};
        // TODO: Check if the extension is already installed
        m[item.detail.name] = {
          url: item.detail.url,
          options: item.detail.options,
          variants: item.detail.variants,
        };
        econf[item.detail.kind] = m;
        urls.push(item.detail.url);
      }
      await patchExtensionConfig(path, econf);
      // Reload extension files
      try {
        const cmd = new Deno.Command(Deno.execPath(), {
          args: ["cache", "--reload", ...urls],
        });
        await cmd.output();
      } catch (err) {
        // Fail silently
        console.debug(`[fall] Failed to reload extension urls: ${err}`);
      }
      // TODO: Show a message to the user
      return false;
    },
  };
}

async function patchExtensionConfig(
  path: string,
  patch: ExtensionConfig,
): Promise<void> {
  const data = JSON.parse(await Deno.readTextFile(path));
  const merged = deepMerge(data, patch, { arrays: "replace" });
  await Deno.writeTextFile(path, JSON.stringify(merged, null, 2));
}
