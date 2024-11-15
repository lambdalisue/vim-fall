import type { Entrypoint } from "jsr:@vim-fall/std@^0.4.0";
import * as builtin from "jsr:@vim-fall/std@^0.4.0/builtin";

export const main: Entrypoint = ({
  defineItemPickerFromSource,
  defineItemPickerFromCurator,
}) => {
  defineItemPickerFromCurator("git-grep", builtin.curator.gitGrep, {
    previewers: [builtin.previewer.file],
    actions: {
      ...builtin.action.defaultOpenActions,
      ...builtin.action.defaultSystemopenActions,
      ...builtin.action.defaultQuickfixActions,
    },
    defaultAction: "open",
  });

  defineItemPickerFromSource("file", builtin.source.file, {
    matchers: [builtin.matcher.fzf],
    previewers: [builtin.previewer.file],
    actions: {
      ...builtin.action.defaultOpenActions,
      ...builtin.action.defaultSystemopenActions,
      ...builtin.action.defaultQuickfixActions,
    },
    defaultAction: "open",
  });

  defineItemPickerFromSource("line", builtin.source.line, {
    matchers: [builtin.matcher.fzf],
    previewers: [builtin.previewer.buffer],
    actions: {
      ...builtin.action.defaultOpenActions,
      ...builtin.action.defaultBufferActions,
      ...builtin.action.defaultQuickfixActions,
    },
    defaultAction: "open",
  });

  defineItemPickerFromSource("buffer", builtin.source.buffer, {
    matchers: [builtin.matcher.fzf],
    previewers: [builtin.previewer.buffer],
    actions: {
      ...builtin.action.defaultOpenActions,
      ...builtin.action.defaultBufferActions,
      ...builtin.action.defaultQuickfixActions,
    },
    defaultAction: "open",
  });

  defineItemPickerFromSource("help", builtin.source.helptag, {
    matchers: [builtin.matcher.fzf],
    previewers: [builtin.previewer.helptag],
    actions: {
      ...builtin.action.defaultHelpActions,
    },
    defaultAction: "help",
  });
};
