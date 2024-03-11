import { resolve as resolveBuiltin } from "./resolver/builtin.ts";
import { resolve as resolveGitHub } from "./resolver/github.ts";

export async function resolve(
  url: string,
  base?: URL | string,
): Promise<URL> {
  return await resolveBuiltin(url) ||
    await resolveGitHub(url) ||
    new URL(url, base);
}
