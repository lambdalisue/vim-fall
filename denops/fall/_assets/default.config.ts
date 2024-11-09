import type { Entrypoint } from "jsr:@vim-fall/std@^0.1.0-pre.0/config";
import { pipeProjectors } from "jsr:@vim-fall/std@^0.1.0-pre.0/projector";
import { composeRenderer } from "jsr:@vim-fall/std@^0.1.0-pre.0/renderer";
import * as builtin from "jsr:@vim-fall/std@^0.1.0-pre.0/builtin";

const quickfixActions = {
  ...builtin.action.defaultQuickfixActions,
  "quickfix:qfreplace": builtin.action.quickfix({
    after: "Qfreplace",
  }),
};

export const main: Entrypoint = (
  {
    defineItemPickerFromSource,
    defineItemPickerFromCurator,
    refineGlobalConfig,
  },
) => {
  refineGlobalConfig({
    coordinator: builtin.coordinator.modern,
  });

  defineItemPickerFromCurator(
    "grep",
    pipeProjectors(
      builtin.curator.grep,
      builtin.modifier.relativePath,
    ),
    {
      previewers: [builtin.previewer.file],
      actions: {
        ...quickfixActions,
        ...builtin.action.defaultOpenActions,
        ...builtin.action.defaultCdActions,
        ...builtin.action.defaultEchoActions,
        ...builtin.action.defaultSystemopenActions,
        ...builtin.action.defaultSubmatchActions,
      },
      defaultAction: "open",
    },
  );

  defineItemPickerFromCurator(
    "git-grep",
    pipeProjectors(
      builtin.curator.gitGrep,
      builtin.modifier.relativePath,
    ),
    {
      previewers: [builtin.previewer.file],
      actions: {
        ...quickfixActions,
        ...builtin.action.defaultOpenActions,
        ...builtin.action.defaultCdActions,
        ...builtin.action.defaultEchoActions,
        ...builtin.action.defaultSystemopenActions,
        ...builtin.action.defaultSubmatchActions,
      },
      defaultAction: "open",
    },
  );

  defineItemPickerFromCurator(
    "rg",
    pipeProjectors(
      builtin.curator.rg,
      builtin.modifier.relativePath,
    ),
    {
      previewers: [builtin.previewer.file],
      actions: {
        ...quickfixActions,
        ...builtin.action.defaultOpenActions,
        ...builtin.action.defaultCdActions,
        ...builtin.action.defaultEchoActions,
        ...builtin.action.defaultSystemopenActions,
        ...builtin.action.defaultSubmatchActions,
      },
      defaultAction: "open",
    },
  );

  defineItemPickerFromSource(
    "file",
    pipeProjectors(
      builtin.source.file({
        excludes: [
          /.*\/node_modules\/.*/,
          /.*\/target\/.*/,
          /.*\/dist\/.*/,
          /.*\/.git\/.*/,
          /.*\/.svn\/.*/,
          /.*\/.hg\/.*/,
          /.*\/.DS_Store$/,
          /.*\/.coverage\//,
        ],
      }),
      builtin.modifier.relativePath,
    ),
    {
      matchers: [builtin.matcher.fzf],
      renderers: [composeRenderer(
        builtin.renderer.smartPath,
        builtin.renderer.nerdfont,
      )],
      previewers: [builtin.previewer.file],
      actions: {
        ...quickfixActions,
        ...builtin.action.defaultOpenActions,
        ...builtin.action.defaultCdActions,
        ...builtin.action.defaultEchoActions,
        ...builtin.action.defaultSystemopenActions,
        ...builtin.action.defaultSubmatchActions,
      },
      defaultAction: "open",
    },
  );

  defineItemPickerFromSource("line", builtin.source.line, {
    matchers: [builtin.matcher.fzf],
    previewers: [builtin.previewer.buffer],
    actions: {
      ...quickfixActions,
      ...builtin.action.defaultOpenActions,
      ...builtin.action.defaultBufferActions,
      ...builtin.action.defaultCdActions,
      ...builtin.action.defaultEchoActions,
      ...builtin.action.defaultSubmatchActions,
    },
    defaultAction: "open",
  });

  defineItemPickerFromSource(
    "buffer",
    builtin.source.buffer({ filter: "bufloaded" }),
    {
      matchers: [builtin.matcher.fzf],
      previewers: [builtin.previewer.buffer],
      actions: {
        ...quickfixActions,
        ...builtin.action.defaultOpenActions,
        ...builtin.action.defaultBufferActions,
        ...builtin.action.defaultCdActions,
        ...builtin.action.defaultEchoActions,
        ...builtin.action.defaultSubmatchActions,
      },
      defaultAction: "open",
    },
  );

  defineItemPickerFromSource("help", builtin.source.helptag, {
    matchers: [builtin.matcher.fzf],
    previewers: [builtin.previewer.helptag],
    actions: {
      ...builtin.action.defaultHelpActions,
      ...builtin.action.defaultEchoActions,
      ...builtin.action.defaultSubmatchActions,
    },
    defaultAction: "help",
  });
};
