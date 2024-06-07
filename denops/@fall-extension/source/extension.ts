import type { GetSource } from "jsr:@lambdalisue/vim-fall@0.6.0/source";
import { assert, is } from "jsr:@core/unknownutil@3.18.0";
import { getConfigDir, loadExtensionConfig } from "../../fall/config/mod.ts";
import {
  isExtensionType,
  listExtensionLoaders,
} from "../../fall/extension/mod.ts";

const isOptions = is.StrictOf(is.PartialOf(is.ObjectOf({
  type: isExtensionType,
})));

export const getSource: GetSource = (denops, options) => {
  assert(options, isOptions);
  const type = options?.type ?? "source";
  return {
    async stream({ cmdline }) {
      cmdline ||= type;
      assert(cmdline, isExtensionType);
      const configDir = await getConfigDir(denops);
      const conf = await loadExtensionConfig(configDir);
      const configs = new Map(Object.entries(conf[cmdline] ?? []));
      const loaders = new Map(
        listExtensionLoaders(cmdline).map((v) => [v.name, v]),
      );
      const names = new Set([...loaders.keys(), ...configs.keys()]);
      return ReadableStream.from([...names.values()].map((name) => {
        const [root] = name.split(":", 1);
        const config = configs.get(name);
        const loader = loaders.get(root);
        return {
          value: name,
          detail: {
            extensionType: cmdline,
            path: loader?.script,
            options: config,
            content: JSON.stringify(config ?? {}, null, 2),
          },
        };
      }));
    },

    complete(arglead, _cmdline, _cursorpos) {
      const extensionTypes = [
        "source",
        "projector",
        "renderer",
        "previewer",
        "action",
      ] as const;
      return extensionTypes.filter((v) => v.startsWith(arglead));
    },
  };
};
