import type { GlobalConfig, RefineGlobalConfig } from "../../@fall/config.ts";

import { ModernLayout } from "../../@fall/builtin/layout/modern.ts";
import { MODERN_THEME } from "../../@fall/builtin/theme/modern.ts";

const globalConfig: GlobalConfig = {
  layout: new ModernLayout(),
  theme: MODERN_THEME,
};

export function getGlobalConfig(): Readonly<GlobalConfig> {
  return globalConfig;
}

export const refineGlobalConfig: RefineGlobalConfig = (params) => {
  if (params.theme) {
    globalConfig.theme = params.theme;
  }
  if (params.layout) {
    globalConfig.layout = params.layout;
  }
};
