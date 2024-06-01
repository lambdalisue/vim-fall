import type { Denops } from "jsr:@denops/core@6.1.0";
import { ensure, is } from "jsr:@core/unknownutil@3.18.0";

export type InputParams = {
  prompt: string;
  text?: string;
  completion?: string;
  title?: string;
};

export async function input(
  denops: Denops,
  params: InputParams,
): Promise<string | null> {
  const result = await denops.dispatch("fall", "util:input", params);
  return ensure(result, is.UnionOf([is.Null, is.String]));
}
