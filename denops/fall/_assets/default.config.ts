import type { Entrypoint } from "../../@fall/config.ts";

import * as builtin from "../../@fall/builtin/mod.ts";
import { pipeProjectors } from "../../@fall/projector.ts";

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
    layout: builtin.layout.modern,
  });

  defineItemPickerFromCurator(
    "grep",
    pipeProjectors(
      builtin.curator.rg,
      builtin.modifier.relativePath,
    ),
    {
      renderer: builtin.renderer.smartPath,
      previewer: builtin.previewer.file,
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
      matcher: builtin.matcher.fzf,
      renderer: builtin.renderer.smartPath,
      previewer: builtin.previewer.file,
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
    matcher: builtin.matcher.fzf,
    previewer: builtin.previewer.buffer,
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
      matcher: builtin.matcher.fzf,
      previewer: builtin.previewer.buffer,
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
    matcher: builtin.matcher.fzf,
    previewer: builtin.previewer.helptag,
    actions: {
      ...builtin.action.defaultHelpActions,
      ...builtin.action.defaultEchoActions,
      ...builtin.action.defaultSubmatchActions,
    },
    defaultAction: "help",
  });
};
