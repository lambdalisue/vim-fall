import { type Action, defineAction } from "../../action.ts";

export function echo<T>(): Action<T> {
  return defineAction((_denops, { item }, _options) => {
    console.log(JSON.stringify(item, null, 2));
  });
}

export const defaultEchoActions: {
  echo: Action<unknown>;
} = {
  echo: echo(),
};
