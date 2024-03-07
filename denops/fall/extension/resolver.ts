import { resolve as builtin } from "./resolver/builtin.ts";
import { resolve as github } from "./resolver/github.ts";

export function resolve(uri: string): URL {
  return github(uri) || builtin(uri) || new URL(uri);
}
