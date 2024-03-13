import type { Action } from "https://deno.land/x/fall_core@v0.5.1/mod.ts";
import { assert, is } from "https://deno.land/x/unknownutil@v3.16.3/mod.ts";

import { type PartialExtensionConfig } from "../../fall/config/extension.ts";
import {
  loadExtensionConfig,
  saveExtensionConfig,
} from "../../fall/config/extension.ts";
import { isExtensionDetail } from "../source/fall_catalog.ts";

const isOptions = is.StrictOf(is.PartialOf(is.ObjectOf({})));

export function getAction(
  options: Record<string, unknown>,
): Action {
  assert(options, isOptions);
  return {
    invoke: async (_denops, { cursorItem, selectedItems }) => {
      const items = selectedItems.length > 0
        ? selectedItems
        : cursorItem
        ? [cursorItem]
        : [];
      const econf: PartialExtensionConfig = {};
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
      await loadExtensionConfig();
      await saveExtensionConfig(econf);
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
