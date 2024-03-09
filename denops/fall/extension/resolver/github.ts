import { match, placeholder as _ } from "jsr:@core/match@0.2.5";

import type { ExtensionConfig } from "../../config/extension.ts";

const pattern = _`github:${_("owner")}/${_("repo")}/${_("path")}`;
const _baseUrl = `https://raw.githubusercontent.com/`;

export function resolve<K extends keyof ExtensionConfig>(
  _kind: K,
  uri: string,
): Promise<URL | undefined> {
  const m = match(pattern, uri);
  if (!m) return Promise.resolve(undefined);
  throw new Error("The 'github:' resolver is not implemented yet");
}
