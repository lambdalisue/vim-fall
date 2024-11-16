import type { Denops } from "jsr:@denops/std@^7.3.2";
import * as buffer from "jsr:@denops/std@^7.3.2/buffer";
import * as vars from "jsr:@denops/std@^7.3.2/variable";
import * as autocmd from "jsr:@denops/std@^7.3.2/autocmd";
import { TextLineStream } from "jsr:@std/streams@^1.0.8/text-line-stream";
import { mergeReadableStreams } from "jsr:@std/streams@^1.0.8/merge-readable-streams";
import { toFileUrl } from "jsr:@std/path@^1.0.8/to-file-url";
import { fromFileUrl } from "jsr:@std/path@^1.0.8/from-file-url";
import { dirname } from "jsr:@std/path@^1.0.8/dirname";
import { copy } from "jsr:@std/fs@^1.0.5/copy";
import {
  buildRefineGlobalConfig,
  type GlobalConfig,
} from "jsr:@vim-fall/config@^0.17.3/global-config";
import {
  type ActionPickerParams,
  buildRefineActionPicker,
} from "jsr:@vim-fall/config@^0.17.3/action-picker";
import {
  buildDefineItemPickerFromCurator,
  buildDefineItemPickerFromSource,
  type ItemPickerParams,
} from "jsr:@vim-fall/config@^0.17.3/item-picker";

import { modern } from "jsr:@vim-fall/std@^0.7.0/builtin/coordinator/modern";
import { MODERN_THEME } from "jsr:@vim-fall/std@^0.7.0/builtin/theme/modern";
import { fzf } from "jsr:@vim-fall/std@^0.7.0/builtin/matcher/fzf";

const defaultConfigUrl = new URL(
  "./_assets/default.config.ts",
  import.meta.url,
);
let initialized: undefined | Promise<void>;

const defaultGlobalConfig: GlobalConfig = {
  coordinator: modern(),
  theme: MODERN_THEME,
};
let globalConfig = { ...defaultGlobalConfig };

const defaultActionPickerParams: ActionPickerParams = {
  matchers: [fzf()],
  coordinator: modern({
    widthRatio: 0.4,
    heightRatio: 0.4,
    hidePreview: true,
  }),
};
let actionPickerParams = { ...defaultActionPickerParams };

const itemPickerParamsMap = new Map<string, ItemPickerParams>();

/**
 * Edit user config
 */
export async function editUserConfig(
  denops: Denops,
  options: buffer.OpenOptions,
): Promise<void> {
  const path = fromFileUrl(await getUserConfigUrl(denops));
  // Try to copy the default config file if the user config file does not exist.
  try {
    const parent = dirname(path);
    await Deno.mkdir(parent, { recursive: true });
    await copy(defaultConfigUrl, path, { overwrite: false });
  } catch (err) {
    if (err instanceof Deno.errors.AlreadyExists) {
      // Expected. Do nothing.
    } else {
      throw err;
    }
  }
  // Open the user config file.
  const info = await buffer.open(denops, path, options);
  // Register autocmd to reload the user config when the buffer is written.
  await autocmd.group(denops, "fall_config", (helper) => {
    helper.remove("*");
    helper.define(
      "BufWritePost",
      `<buffer=${info.bufnr}>`,
      `call denops#notify("${denops.name}", "config:reload", [#{ verbose: v:true }])`,
    );
  });
}

/**
 * Load user config from the g:fall_config_path.
 */
export function loadUserConfig(
  denops: Denops,
  { reload = false, verbose = false } = {},
): Promise<void> {
  if (initialized && !reload) {
    return initialized;
  }
  // Avoid reloading when the user config is not yet loaded.
  reload = initialized ? reload : false;
  initialized = (async () => {
    const configUrl = await getUserConfigUrl(denops);
    const suffix = reload ? `#${performance.now()}` : "";
    try {
      const { main } = await import(`${configUrl.href}${suffix}`);
      reset();
      await main(buildContext(denops));
      if (verbose) {
        await denops.cmd(
          `echomsg "[fall] User config is loaded: ${configUrl}"`,
        );
      }
    } catch (err) {
      // Avoid loading default configration if reload is set to keep the previous configuration.
      if (reload) {
        if (err instanceof Deno.errors.NotFound) {
          console.debug(`User config not found: '${configUrl}'. Skip.`);
        } else {
          console.warn(`Failed to load user config. Skip: ${err}`);
        }
        return;
      }
      // Fallback to the default configuration.
      if (err instanceof Deno.errors.NotFound) {
        console.debug(
          `User config not found: '${configUrl}'. Fallback to the default config.`,
        );
      } else {
        console.warn(
          `Failed to load user config. Fallback to the default config: ${err}`,
        );
      }
      const { main } = await import(defaultConfigUrl.href);
      reset();
      await main(buildContext(denops));
      if (verbose) {
        await denops.cmd(
          `echomsg "[fall] Default config is loaded: ${defaultConfigUrl}"`,
        );
      }
    }
  })();
  return initialized;
}

/**
 * Recache user config by running `deno cache --reload` command.
 */
export async function recacheUserConfig(
  denops: Denops,
  { signal }: { signal?: AbortSignal },
): Promise<void> {
  const configUrl = await getUserConfigUrl(denops);
  const cmd = new Deno.Command(Deno.execPath(), {
    args: ["cache", "--no-lock", "--reload", "--allow-import", configUrl.href],
    stdin: "null",
    stdout: "piped",
    stderr: "piped",
  });
  await using proc = cmd.spawn();
  signal?.addEventListener("abort", () => {
    try {
      proc.kill();
    } catch {
      // Do nothing
    }
  }, { once: true });
  mergeReadableStreams(proc.stdout, proc.stderr)
    .pipeThrough(new TextDecoderStream(), { signal })
    .pipeThrough(new TextLineStream(), { signal })
    .pipeTo(
      new WritableStream({
        async start() {
          await denops.cmd(
            `redraw | echomsg "[fall] Recaching user config: ${configUrl}"`,
          );
        },
        async write(line) {
          await denops.cmd(
            `redraw | echohl Comment | echomsg "[fall] ${line}" | echohl NONE`,
          );
        },
        async close() {
          await denops.cmd(
            `redraw | echomsg "[fall] Recaching user config is completed."`,
          );
        },
      }),
      { signal },
    );
  await proc.status;
  await loadUserConfig(denops, { verbose: true, reload: true });
}

/**
 * Get global config.
 */
export function getGlobalConfig(): Readonly<GlobalConfig> {
  return globalConfig;
}

/**
 * Get action picker params.
 */
export function getActionPickerParams(): Readonly<
  ActionPickerParams
> {
  return actionPickerParams;
}

/**
 * Get item picker params.
 */
export function getItemPickerParams(
  name: string,
): Readonly<ItemPickerParams> | undefined {
  const params = itemPickerParamsMap.get(name);
  if (params) {
    return params;
  }
  return undefined;
}

/**
 * List item picker names.
 */
export function listItemPickerNames(): readonly string[] {
  return Array.from(itemPickerParamsMap.keys());
}

function reset(): void {
  globalConfig = { ...defaultGlobalConfig };
  actionPickerParams = { ...defaultActionPickerParams };
  itemPickerParamsMap.clear();
}

function buildContext(denops: Denops) {
  return {
    denops,
    refineGlobalConfig: buildRefineGlobalConfig(globalConfig),
    refineActionPicker: buildRefineActionPicker(actionPickerParams),
    defineItemPickerFromSource: buildDefineItemPickerFromSource(
      itemPickerParamsMap,
    ),
    defineItemPickerFromCurator: buildDefineItemPickerFromCurator(
      itemPickerParamsMap,
    ),
  };
}

async function getUserConfigUrl(denops: Denops): Promise<URL> {
  try {
    const path = await vars.g.get(denops, "fall_config_path") as string;
    return toFileUrl(path);
  } catch (err) {
    throw new Error(
      `Failed to get user config path from 'g:fall_config_path': ${err}`,
    );
  }
}

export type { ActionPickerParams, GlobalConfig, ItemPickerParams };
