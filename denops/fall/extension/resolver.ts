import { resolve as resolveBuiltin } from "./resolver/builtin.ts";

export async function resolve(
  url: string,
  base?: URL | string,
): Promise<URL> {
  return await resolveBuiltin(url) || new URL(url, base);
}
