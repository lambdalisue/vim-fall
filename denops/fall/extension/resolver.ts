import type { ExtensionConfig } from "../config/extension.ts";
import { resolve as builtin } from "./resolver/builtin.ts";
import { resolve as github } from "./resolver/github.ts";

export function resolve<K extends keyof ExtensionConfig>(
  kind: K,
  uri: string,
): URL {
  return github(kind, uri) || builtin(kind, uri) || new URL(uri);
}
