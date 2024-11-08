import { type Curator, defineCurator } from "../../curator.ts";

export function noop(): Curator<undefined> {
  return defineCurator<undefined>(async function* () {});
}
