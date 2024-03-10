import { resolve as resolveBuiltin } from "./resolver/builtin.ts";
import { resolve as resolvePackage } from "./resolver/package.ts";

export async function resolve(
  uri: string,
  base?: URL | string,
): Promise<URL> {
  return await resolveBuiltin(uri) ||
    await resolvePackage(uri) ||
    new URL(uri, base);
}
