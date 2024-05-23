import type { Denops } from "https://deno.land/x/denops_std@v6.4.0/mod.ts";
import * as opt from "https://deno.land/x/denops_std@v6.4.0/option/mod.ts";
import { assert, ensure, is } from "jsr:@core/unknownutil@3.18.0";

import { getConfigDir, loadExtensionConfig } from "../config/loader.ts";
import {
  discoverExtensionLoaders,
  listExtensionNames,
  loadExtension,
  registerExtensionLoader,
} from "../extension/loader.ts";

const isDefs = is.RecordOf(is.String, is.String);

export function main(denops: Denops): void {
  denops.dispatcher = {
    ...denops.dispatcher,
    "extension:discover": async () => {
      const runtimepath = await opt.runtimepath.get(denops);
      await discoverExtensionLoaders(runtimepath);
    },
    "extension:register": async (defs) => {
      await Promise.allSettled(
        Object.entries(ensure(defs, isDefs)).map(([k, v]) =>
          registerExtensionLoader(k, v)
        ),
      );
    },
    "extension:complete": async (arglead, cmdline, cursorpos) => {
      try {
        assert(arglead, is.String);
        assert(cmdline, is.String);
        assert(cursorpos, is.Number);
        const configDir = await getConfigDir(denops);
        const conf = await loadExtensionConfig(configDir);
        const expr = cmdline.replace(/^\S+\s+/, "");
        if (!expr.includes(" ")) {
          const sources = new Set([
            ...listExtensionNames("source"),
            ...Object.keys(conf.source ?? []),
          ]);
          return [...sources].filter((v) => v.startsWith(arglead)).toSorted();
        } else {
          const name = expr.split(" ").at(0) ?? "";
          const source = await loadExtension(denops, conf, "source", name);
          return await source?.complete?.(arglead, expr, cursorpos);
        }
      } catch (err) {
        console.debug(err.message ?? err);
      }
    },
  };
}
