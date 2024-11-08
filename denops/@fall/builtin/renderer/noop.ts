import { defineRenderer, type Renderer } from "../../renderer.ts";

export function noop<T>(): Renderer<T> {
  return defineRenderer<T>(() => {});
}
