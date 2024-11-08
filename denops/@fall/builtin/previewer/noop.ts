import { definePreviewer, type Previewer } from "../../previewer.ts";

export function noop<T>(): Previewer<T> {
  return definePreviewer(() => {});
}
