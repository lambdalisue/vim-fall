import type { Denops } from "https://deno.land/x/denops_std@v6.4.0/mod.ts";
import { ensure, is, type Predicate } from "jsr:@core/unknownutil@3.18.0";

export interface InputParams {
  prompt: string;
  text?: string;
  completion?: string;
  title?: string;
}

export const isInputParams = is.ObjectOf({
  prompt: is.String,
  text: is.OptionalOf(is.String),
  completion: is.OptionalOf(is.String),
  title: is.OptionalOf(is.String),
}) satisfies Predicate<InputParams>;

export async function input(
  denops: Denops,
  params: InputParams,
): Promise<string | null> {
  const result = await denops.dispatch("fall", "util:input", params);
  return ensure(result, is.UnionOf([is.Null, is.String]));
}
