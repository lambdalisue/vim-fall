import type { Denops } from "jsr:@denops/std@^7.0.0";
import type { GetSource } from "jsr:@lambdalisue/vim-fall@^0.6.0/source";
import { omit } from "jsr:@std/collections@^1.0.0-rc.1/omit";
import { deepMerge } from "jsr:@std/collections@^0.224.2/deep-merge";
import { assert, is } from "jsr:@core/unknownutil@^4.0.0";

const extensionTypes = [
  "source",
  "projector",
  "renderer",
  "previewer",
  "action",
] as const;

const isExtensionType = is.LiteralOneOf(extensionTypes);

type ExtensionType = typeof extensionTypes[number];

type ExtensionConfig = Record<string, Record<string, unknown>>;

type Extension = {
  type: string;
  name: string;
  script: string;
};

const isOptions = is.StrictOf(is.PartialOf(is.ObjectOf({
  type: isExtensionType,
})));

export const getSource: GetSource = (denops, options) => {
  assert(options, isOptions);
  const extensionType = options.type;
  return {
    async stream() {
      const cMap = new Map(
        Object.entries(await loadConfig(denops))
          .filter(([type]) => !extensionType || type === extensionType)
          .flatMap(([type, v]) =>
            Object.entries(v).map(([k, v]) => [`${type}/${k}`, v])
          ),
      );
      const eMap = new Map(
        (await listExtensions(denops, extensionType))
          .map((v) => [`${v.type}/${v.name}`, v]),
      );
      const keys = new Set([...cMap.keys(), ...eMap.keys()]);
      const items = [...keys.values()]
        .map((key) => {
          const [extensionType, name] = splitKey(key);
          const [root] = name.split(":", 1);
          const config = deepMerge(
            cMap.get(`${extensionType}/${root}`) ?? {},
            cMap.get(key) ?? {},
          );
          const extension = eMap.get(`${extensionType}/${root}`);
          if (!extension) {
            return undefined;
          }
          return {
            value: key,
            detail: {
              extension: {
                ...extension,
                name,
                root,
                config: config,
              },
              path: extension.script,
            },
          };
        })
        .filter(isDefined)
        .filter((v) =>
          !extensionType || v.detail.extension.type === extensionType
        );
      return ReadableStream.from(items);
    },

    complete(arglead, _cmdline, _cursorpos) {
      return extensionTypes.filter((v) => v.startsWith(arglead));
    },
  };
};

function splitKey(key: string): [ExtensionType, string] {
  const [extensionType, ...rest] = key.split("/");
  return [extensionType as ExtensionType, rest.join("/")];
}

async function loadConfig(
  denops: Denops,
): Promise<ExtensionConfig> {
  return omit(
    await denops.dispatch(
      denops.name,
      "config:load",
      "extension",
    ) as ExtensionConfig,
    ["path"],
  );
}

async function listExtensions(
  denops: Denops,
  extensionType?: ExtensionType,
): Promise<Extension[]> {
  return await denops.dispatch(
    denops.name,
    "extension:list",
    extensionType,
  ) as Extension[];
}

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}
