import type { Denops } from "https://deno.land/x/denops_std@v6.4.0/mod.ts";
import { ensure, is, type Predicate } from "jsr:@core/unknownutil@3.18.0";

import { isDefined } from "../util/collection.ts";
import { hideMsgArea } from "../util/hide_msg_area.ts";
import { Input } from "../ui/input.ts";
import {
  getConfigDir,
  getInputStyleConfig,
  loadStyleConfig,
} from "../config/mod.ts";

interface InputParams {
  prompt: string;
  text?: string;
  completion?: string;
  title?: string;
}

const isInputParams = is.ObjectOf({
  prompt: is.String,
  text: is.OptionalOf(is.String),
  completion: is.OptionalOf(is.String),
  title: is.OptionalOf(is.String),
}) satisfies Predicate<InputParams>;

async function input(
  denops: Denops,
  params: InputParams,
  options: { signal?: AbortSignal } = {},
): Promise<string | null> {
  const configDir = await getConfigDir(denops);
  const styleConf = await loadStyleConfig(configDir);
  const inputStyle = getInputStyleConfig(styleConf);

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

  const inputDialog = new Input({
    title: params.title,
    style: {
      ...(inputStyle.style ?? {}),
    },
    input: params,
  });
  stack.use(await inputDialog.open(denops));
  return await inputDialog.start(denops, { signal });
}

export function main(denops: Denops): void {
  denops.dispatcher = {
    ...denops.dispatcher,
    "util:input": async (params) => {
      await using _guard = await hideMsgArea(denops);
      return await input(denops, ensure(params, isInputParams));
    },
  };
}
