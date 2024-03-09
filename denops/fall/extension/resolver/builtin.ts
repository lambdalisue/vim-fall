import { match, placeholder as _ } from "jsr:@core/match@0.2.5";

import type { ExtensionConfig } from "../../config/extension.ts";

const pattern = _`builtin:${_("name")}`;

export function resolve<K extends keyof ExtensionConfig>(
  kind: K,
  uri: string,
): Promise<URL | undefined> {
  const m = match(pattern, uri);
  if (!m) return Promise.resolve(undefined);
  const { name } = m;
  const path = `../../../@fall-builtin/${pathMap[kind]}/${name}.ts`;
  return Promise.resolve(new URL(path, import.meta.url));
}

const pathMap = {
  action: "actions",
  processor: "processors",
  previewer: "previewers",
  renderer: "renderers",
  source: "sources",
} satisfies Record<keyof ExtensionConfig, string>;
