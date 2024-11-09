import type {
  GlobalConfig,
  RefineGlobalConfig,
} from "jsr:@vim-fall/std@^0.1.0-pre.0/config";
import { modern as modernLayout } from "jsr:@vim-fall/std@^0.1.0-pre.0/builtin/coordinator/modern";
import { MODERN_THEME } from "jsr:@vim-fall/std@^0.1.0-pre.0/builtin/theme/modern";
import { derive } from "jsr:@vim-fall/std@^0.1.0-pre.0/util/derivable";

const globalConfig: GlobalConfig = {
  coordinator: modernLayout(),
  theme: MODERN_THEME,
};

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
