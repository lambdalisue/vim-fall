import type {
  ActionPickerParams,
  GlobalConfig,
  RefineActionPicker,
} from "../../@fall/config.ts";
import { getGlobalConfig } from "./global_config.ts";

import { CompactLayout } from "../../@fall/builtin/layout/compact.ts";
import { SubstringMatcher } from "../../@fall/builtin/matcher/substring.ts";

const actionPickerParams: ActionPickerParams = {
  matcher: new SubstringMatcher(),
  layout: new CompactLayout({
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
    actionPickerParams.matcher = params.matcher;
  }
  if (params.sorter) {
    actionPickerParams.sorter = params.sorter;
  }
  if (params.renderer) {
    actionPickerParams.renderer = params.renderer;
  }
  if (params.previewer) {
    actionPickerParams.previewer = params.previewer;
  }
  if (params.layout) {
    actionPickerParams.layout = params.layout;
  }
  if (params.theme) {
    actionPickerParams.theme = params.theme;
  }
};
