import { match, placeholder as _ } from "jsr:@core/match@0.1.4";

const pattern = _`github:${_("path")}`;
const baseUrl = `https://raw.githubusercontent.com/`;

export function resolve(uri: string): URL | undefined {
  const m = match(pattern, uri);
  if (!m) return undefined;
  return new URL(`${baseUrl}${m.path}`);
}
