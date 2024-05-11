import type { Denops } from "https://deno.land/x/denops_std@v6.4.0/mod.ts";
import { is, type Predicate } from "jsr:@core/unknownutil@3.18.0";

import { isDefined } from "./util/collection.ts";
import { Input } from "./view/input.ts";
import { getConfigPath, loadConfig } from "./config/util.ts";

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
  options: { signal?: AbortSignal } = {},
): Promise<string | null> {
  await using stack = new AsyncDisposableStack();
  const controller = new AbortController();
  const signal = AbortSignal.any(
    [controller.signal, options.signal].filter(isDefined),
  );
  stack.defer(() => {
    try {
      controller.abort();
    } catch {
      // Fail silently
    }
  });

  const configPath = await getConfigPath(denops);
  const config = await loadConfig(configPath);

  await using inputDialog = await Input.create(denops, {
    ...(config.input ?? {}),
    layout: {
      ...(config.input?.layout ?? {}),
      title: params.title,
    },
    input: params,
  });
  return await inputDialog.start(denops, { signal });
}
