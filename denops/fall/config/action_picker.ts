import { modern } from "jsr:@vim-fall/std@^0.4.0/builtin/coordinator/modern";
import { fzf as fzfMatcher } from "jsr:@vim-fall/std@^0.4.0/builtin/matcher/fzf";

import type {
  ActionPickerParams,
  GlobalConfig,
  RefineActionPicker,
} from "../../@fall-config/config.ts";
import { derive, deriveArray } from "../../@fall-config/derivable.ts";
import { getGlobalConfig } from "./global_config.ts";

const actionPickerParams: ActionPickerParams = {
  matchers: [fzfMatcher()],
  coordinator: modern({
    hidePreview: true,
    widthRatio: 0.4,
    heightRatio: 0.4,
  }),
};

export function resetActionPickerParams(): void {
  actionPickerParams.matchers = [fzfMatcher()];
  actionPickerParams.coordinator = modern({
    hidePreview: true,
    widthRatio: 0.4,
    heightRatio: 0.4,
  });
}

export function getActionPickerParams(): Readonly<
  ActionPickerParams & GlobalConfig
> {
  return {
    ...getGlobalConfig(),
    ...actionPickerParams,
  };
}

export const refineActionPicker: RefineActionPicker = (params) => {
  if (params.matchers) {
    actionPickerParams.matchers = deriveArray(params.matchers);
  }
  if (params.sorters) {
    actionPickerParams.sorters = deriveArray(params.sorters);
  }
  if (params.renderers) {
    actionPickerParams.renderers = deriveArray(params.renderers);
  }
  if (params.previewers) {
    actionPickerParams.previewers = deriveArray(params.previewers);
  }
  if (params.coordinator) {
    actionPickerParams.coordinator = derive(params.coordinator);
  }
  if (params.theme) {
    actionPickerParams.theme = derive(params.theme);
  }
};
