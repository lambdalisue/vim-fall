import type { Denops } from "jsr:@denops/std@^7.3.0";
import type { Action, InvokeParams } from "../../action.ts";

export class EchoAction<T> implements Action<T> {
  invoke(
    _denops: Denops,
    { item }: InvokeParams<T>,
    _options: { signal?: AbortSignal },
  ): void {
    console.log(JSON.stringify(item, null, 2));
  }
}

export const echoAction: { echo: EchoAction<unknown> } = {
  echo: new EchoAction(),
};
