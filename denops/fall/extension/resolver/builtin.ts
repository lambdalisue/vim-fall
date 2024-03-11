import { match, placeholder as _ } from "jsr:@core/match@0.2.5";

const pattern = _`fallbuiltin://${_("path")}`;

export function resolve(
  url: string,
): Promise<URL | undefined> {
  const m = match(pattern, url);
  if (!m) return Promise.resolve(undefined);
  const { path } = m;
  return Promise.resolve(
    new URL(`../../../@fall-builtin/${path}`, import.meta.url),
  );
}
