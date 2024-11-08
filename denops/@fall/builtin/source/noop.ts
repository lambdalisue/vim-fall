import { defineSource, type Source } from "../../source.ts";

export function noop(): Source<undefined> {
  return defineSource(async function* () {});
}
