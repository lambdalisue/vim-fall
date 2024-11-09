import type { GlobalConfig, RefineGlobalConfig } from "../../@fall/config.ts";

import { modern as modernLayout } from "../../@fall/builtin/layout/modern.ts";
import { MODERN_THEME } from "../../@fall/builtin/theme/modern.ts";
import { derive } from "../../@fall/util/derivable.ts";

const globalConfig: GlobalConfig = {
  layout: modernLayout(),
  theme: MODERN_THEME,
};

export function getGlobalConfig(): Readonly<GlobalConfig> {
  return globalConfig;
}

export const refineGlobalConfig: RefineGlobalConfig = (params) => {
  if (params.theme) {
    globalConfig.theme = derive(params.theme);
  }
  if (params.layout) {
    globalConfig.layout = derive(params.layout);
  }
};
