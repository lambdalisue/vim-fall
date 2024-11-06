import type { Entrypoint } from "../../@fall/config.ts";

import * as builtin from "../../@fall/builtin/mod.ts";

const quickfixActions = {
  ...builtin.action.quickfixAction,
  "quickfix:qfreplace": new builtin.action.QuickfixAction({
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
    layout: new builtin.layout.ModernLayout(),
  });

  defineItemPickerFromCurator("grep", new builtin.curator.RgCurator(), {
    renderer: new builtin.renderer.SmartPathRenderer(),
    previewer: new builtin.previewer.FilePreviewer(),
    actions: {
      ...builtin.action.echoAction,
      ...builtin.action.openActions,
      ...builtin.action.cdActions,
      ...builtin.action.bufferActions,
      ...builtin.action.writeAction,
      ...builtin.action.systemopenAction,
      ...quickfixActions,
      "submatch:fzf": new builtin.action.SubmatchAction(
        new builtin.matcher.FzfMatcher(),
      ),
      "submatch:substring": new builtin.action.SubmatchAction(
        new builtin.matcher.SubstringMatcher(),
      ),
      "submatch:regexp": new builtin.action.SubmatchAction(
        new builtin.matcher.RegexpMatcher(),
      ),
    },
    defaultAction: "open",
  });

  defineItemPickerFromSource(
    "file",
    new builtin.source.FileSource({
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
    {
      matcher: new builtin.matcher.FzfMatcher(),
      renderer: new builtin.renderer.SmartPathRenderer(),
      previewer: new builtin.previewer.FilePreviewer(),
      actions: {
        ...builtin.action.echoAction,
        ...builtin.action.openActions,
        ...builtin.action.cdActions,
        ...builtin.action.bufferActions,
        ...builtin.action.writeAction,
        ...builtin.action.systemopenAction,
        ...quickfixActions,
        "submatch:substring": new builtin.action.SubmatchAction(
          new builtin.matcher.SubstringMatcher(),
        ),
        "submatch:regexp": new builtin.action.SubmatchAction(
          new builtin.matcher.RegexpMatcher(),
        ),
      },
      defaultAction: "open",
    },
  );

  defineItemPickerFromSource("line", new builtin.source.LineSource(), {
    matcher: new builtin.matcher.FzfMatcher(),
    previewer: new builtin.previewer.BufferPreviewer(),
    actions: {
      ...builtin.action.echoAction,
      ...builtin.action.openActions,
      ...quickfixActions,
      "submatch:substring": new builtin.action.SubmatchAction(
        new builtin.matcher.SubstringMatcher(),
      ),
      "submatch:regexp": new builtin.action.SubmatchAction(
        new builtin.matcher.RegexpMatcher(),
      ),
    },
    defaultAction: "open",
  });

  defineItemPickerFromSource(
    "buffer",
    new builtin.source.BufferSource({ filter: "bufloaded" }),
    {
      matcher: new builtin.matcher.FzfMatcher(),
      previewer: new builtin.previewer.BufferPreviewer(),
      actions: {
        ...builtin.action.echoAction,
        ...builtin.action.openActions,
        ...builtin.action.writeAction,
        ...builtin.action.bufferActions,
        ...quickfixActions,
        "submatch:substring": new builtin.action.SubmatchAction(
          new builtin.matcher.SubstringMatcher(),
        ),
        "submatch:regexp": new builtin.action.SubmatchAction(
          new builtin.matcher.RegexpMatcher(),
        ),
      },
      defaultAction: "open",
    },
  );

  defineItemPickerFromSource("help", new builtin.source.HelptagSource(), {
    matcher: new builtin.matcher.FzfMatcher(),
    previewer: new builtin.previewer.HelptagPreviewer(),
    actions: {
      ...builtin.action.echoAction,
      ...builtin.action.helpAction,
      "submatch:substring": new builtin.action.SubmatchAction(
        new builtin.matcher.SubstringMatcher(),
      ),
      "submatch:regexp": new builtin.action.SubmatchAction(
        new builtin.matcher.RegexpMatcher(),
      ),
    },
    defaultAction: "help",
  });
};
