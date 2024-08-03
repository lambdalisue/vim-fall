import type { Denops } from "jsr:@denops/std@^7.0.0";
import * as opt from "jsr:@denops/std@^7.0.0/option";
import {
  as,
  assert,
  ensure,
  is,
  type Predicate,
} from "jsr:@core/unknownutil@^4.0.0";

import { getConfigDir, loadExtensionConfig } from "../config/mod.ts";
import {
  discoverExtensionLoaders,
  type ExtensionType,
  listExtensionLoaders,
  loadExtension,
  registerExtensionLoader,
} from "../extension/mod.ts";

const isDefs = is.RecordOf(is.String, is.String);

export const isExtensionType = is.LiteralOneOf(
  [
    "source",
    "projector",
    "renderer",
    "previewer",
    "action",
  ] as const,
) satisfies Predicate<ExtensionType>;

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
            ...listExtensionLoaders("source").map((v) => v.name),
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
    "extension:list": (type) => {
      assert(type, as.Optional(isExtensionType));
      const loaders = type
        ? listExtensionLoaders(type)
        : listExtensionLoaders();
      return loaders.map((v) => ({
        type: v.type,
        name: v.name,
        script: v.script,
      }));
    },
  };
}
