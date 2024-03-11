import { resolve as resolveBuiltin } from "./resolver/builtin.ts";
import { resolve as resolveGitHub } from "./resolver/github.ts";
import { resolve as resolvePackage } from "./resolver/package.ts";

export async function resolve(
  uri: string,
  base?: URL | string,
): Promise<URL> {
  return await resolveBuiltin(uri) ||
    await resolvePackage(uri) ||
    await resolveGitHub(uri) ||
    new URL(uri, base);
}
