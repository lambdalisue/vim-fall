import { match, placeholder as _ } from "jsr:@core/match@0.2.5";

const builtinPattern = _`fallbuiltin://${_("path")}`;

export async function resolve(
  url: string,
): Promise<URL> {
  return await resolveBuiltin(url) || new URL(url);
}

function resolveBuiltin(
  url: string,
): Promise<URL | undefined> {
  const m = match(builtinPattern, url);
  if (!m) return Promise.resolve(undefined);
  const { path } = m;
  return Promise.resolve(
    new URL(`../../@fall-builtin/${path}`, import.meta.url),
  );
}
