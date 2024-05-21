import type { Denops } from "https://deno.land/x/denops_std@v6.4.0/mod.ts";
import * as opt from "https://deno.land/x/denops_std@v6.4.0/option/mod.ts";
import { assert, ensure, is } from "jsr:@core/unknownutil@3.18.0";

import { getConfigDir, loadExtensionConfig } from "../config/loader.ts";
import { isExtensionType } from "../extension/type.ts";
import {
  discoverExtensionLoaders,
  listExtensionNames,
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
    "extension:list": async (type) => {
      assert(type, isExtensionType);
      const configDir = await getConfigDir(denops);
      const conf = await loadExtensionConfig(configDir);
      return [
        ...listExtensionNames(type),
        ...Object.keys(conf[type] ?? {}),
      ];
    },
  };
}
