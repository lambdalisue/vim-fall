import { modern as modern } from "jsr:@vim-fall/std@^0.4.0/builtin/coordinator/modern";
import { MODERN_THEME } from "jsr:@vim-fall/std@^0.4.0/builtin/theme/modern";

import type {
  GlobalConfig,
  RefineGlobalConfig,
} from "../../@fall-config/config.ts";
import { derive } from "../../@fall-config/derivable.ts";

const globalConfig: GlobalConfig = {
  coordinator: modern(),
  theme: MODERN_THEME,
};

export function resetGlobalConfig(): void {
  globalConfig.coordinator = modern();
  globalConfig.theme = MODERN_THEME;
}

export function getGlobalConfig(): Readonly<GlobalConfig> {
  return globalConfig;
}

export const refineGlobalConfig: RefineGlobalConfig = (params) => {
  if (params.theme) {
    globalConfig.theme = derive(params.theme);
  }
  if (params.coordinator) {
    globalConfig.coordinator = derive(params.coordinator);
  }
};
