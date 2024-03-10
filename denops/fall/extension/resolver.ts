import type { ExtensionConfig } from "../config/extension.ts";
import { resolve as builtin } from "./resolver/builtin.ts";

export async function resolve<K extends keyof ExtensionConfig>(
  kind: K,
  uri: string,
): Promise<URL> {
  return await builtin(kind, uri) || new URL(uri);
}
