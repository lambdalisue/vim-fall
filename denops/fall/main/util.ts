import type { Denops } from "jsr:@denops/std@^7.0.0";
import { as, ensure, is, type Predicate } from "jsr:@core/unknownutil@^4.0.0";

import { isDefined } from "../util/collection.ts";
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
  text: as.Optional(is.String),
  completion: as.Optional(is.String),
  title: as.Optional(is.String),
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
    "util:input": (params) => {
      return input(denops, ensure(params, isInputParams));
    },
  };
}
