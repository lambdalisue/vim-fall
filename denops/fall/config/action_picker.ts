import type {
  ActionPickerParams,
  GlobalConfig,
  RefineActionPicker,
} from "../../@fall/config.ts";
import { getGlobalConfig } from "./global_config.ts";

import { modern as modernLayout } from "../../@fall/builtin/coordinator/modern.ts";
import { fzf as fzfMatcher } from "../../@fall/builtin/matcher/fzf.ts";
import { derive } from "../../@fall/util/derivable.ts";

const actionPickerParams: ActionPickerParams = {
  matcher: fzfMatcher(),
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
  if (params.matcher) {
    actionPickerParams.matcher = derive(params.matcher);
  }
  if (params.sorter) {
    actionPickerParams.sorter = derive(params.sorter);
  }
  if (params.renderer) {
    actionPickerParams.renderer = derive(params.renderer);
  }
  if (params.previewer) {
    actionPickerParams.previewer = derive(params.previewer);
  }
  if (params.coordinator) {
    actionPickerParams.coordinator = derive(params.coordinator);
  }
  if (params.theme) {
    actionPickerParams.theme = derive(params.theme);
  }
};
