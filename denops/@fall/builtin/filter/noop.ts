import { defineProjector, type Projector } from "../../projector.ts";

export function noop<T>(): Projector<T> {
  return defineProjector<T>(async function* () {});
}
