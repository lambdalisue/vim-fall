import { type Action, defineAction } from "../../action.ts";

export function noop<T>(): Action<T> {
  return defineAction(() => {});
}

export const defaultNoopActions: {
  noop: Action<unknown>;
} = {
  noop: noop(),
};
