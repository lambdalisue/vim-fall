import { resolve as builtin } from "./resolver/builtin.ts";

export async function resolve(
  uri: string,
  base?: URL | string,
): Promise<URL> {
  return await builtin(uri) || new URL(uri, base);
}
