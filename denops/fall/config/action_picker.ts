import type {
  ActionPickerParams,
  GlobalConfig,
  RefineActionPicker,
} from "../../@fall/config.ts";
import { getGlobalConfig } from "./global_config.ts";

import { modern as modernLayout } from "../../@fall/builtin/coordinator/modern.ts";
import { fzf as fzfMatcher } from "../../@fall/builtin/matcher/fzf.ts";
import { derive, deriveArray } from "../../@fall/util/derivable.ts";

const actionPickerParams: ActionPickerParams = {
  matchers: [fzfMatcher()],
  coordinator: modernLayout({
    widthRatio: 0.4,
    heightRatio: 0.4,
  }),
};

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
