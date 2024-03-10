import { match, placeholder as _ } from "jsr:@core/match@0.2.5";

const pattern = _`builtin:${_("path")}`;

export function resolve(
  uri: string,
): Promise<URL | undefined> {
  const m = match(pattern, uri);
  if (!m) return Promise.resolve(undefined);
  const { path } = m;
  return Promise.resolve(
    new URL(`../../../@fall-builtin/${path}.ts`, import.meta.url),
  );
}
