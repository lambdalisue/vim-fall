import { match, placeholder as _ } from "jsr:@core/match@0.1.4";

const pattern = _`builtin:${_("path")}`;

export function resolve(uri: string): URL | undefined {
  const m = match(pattern, uri);
  if (!m) return undefined;
  return new URL(`../../../@fall-builtin/${m.path}`, import.meta.url);
}
