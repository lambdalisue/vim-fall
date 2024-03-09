import type { ExtensionConfig } from "../config/extension.ts";
import { resolve as builtin } from "./resolver/builtin.ts";
import { resolve as github } from "./resolver/github.ts";

export async function resolve<K extends keyof ExtensionConfig>(
  kind: K,
  uri: string,
): Promise<URL> {
  return await github(kind, uri) || await builtin(kind, uri) || new URL(uri);
}
