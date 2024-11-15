import type { Denops } from "jsr:@denops/std@^7.3.2";
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

import { modern } from "jsr:@vim-fall/std@^0.4.0/builtin/coordinator/modern";
import { MODERN_THEME } from "jsr:@vim-fall/std@^0.4.0/builtin/theme/modern";
import { fzf } from "jsr:@vim-fall/std@^0.4.0/builtin/matcher/fzf";

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
  }),
};
let actionPickerParams = { ...defaultActionPickerParams };

const itemPickerParamsMap = new Map<string, ItemPickerParams>();

const refineGlobalConfig = buildRefineGlobalConfig(globalConfig);
const refineActionPicker = buildRefineActionPicker(actionPickerParams);
const defineItemPickerFromSource = buildDefineItemPickerFromSource(
  itemPickerParamsMap,
);
const defineItemPickerFromCurator = buildDefineItemPickerFromCurator(
  itemPickerParamsMap,
);

function reset(): void {
  globalConfig = { ...defaultGlobalConfig };
  actionPickerParams = { ...defaultActionPickerParams };
  itemPickerParamsMap.clear();
}

export async function loadUserConfig(
  denops: Denops,
  path: string,
  { suffix }: { suffix?: string } = {},
): Promise<void> {
  const ctx = {
    denops,
    defineItemPickerFromSource,
    defineItemPickerFromCurator,
    refineActionPicker,
    refineGlobalConfig,
  };
  try {
    const { main } = await import(`${path}${suffix ?? ""}`);
    reset();
    await main(ctx);
  } catch (e) {
    console.warn(
      `Failed to load user config. Fallback to the default config: ${e}`,
    );
    const { main } = await import(
      new URL("./_assets/default.config.ts", import.meta.url).href
    );
    await main(ctx);
  }
}

export function getGlobalConfig(): Readonly<GlobalConfig> {
  return globalConfig;
}

export function getActionPickerParams(): Readonly<
  ActionPickerParams & GlobalConfig
> {
  return {
    ...getGlobalConfig(),
    ...actionPickerParams,
  };
}

export function listItemPickerNames(): readonly string[] {
  return Array.from(itemPickerParamsMap.keys());
}

export function getItemPickerParams(
  name: string,
): Readonly<ItemPickerParams & GlobalConfig> | undefined {
  const params = itemPickerParamsMap.get(name);
  if (params) {
    return { ...getGlobalConfig(), ...params };
  }
  return undefined;
}
