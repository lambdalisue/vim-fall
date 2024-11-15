import type { Entrypoint } from "jsr:@vim-fall/config@^0.17.3";
import {
  composeRenderers,
  refineCurator,
  refineSource,
} from "jsr:@vim-fall/std@^0.5.0";
import * as builtin from "jsr:@vim-fall/std@^0.5.0/builtin";
import { SEPARATOR } from "jsr:@std/path@^1.0.8/constants";

const myPathActions = {
  ...builtin.action.defaultOpenActions,
  ...builtin.action.defaultSystemopenActions,
  ...builtin.action.defaultCdActions,
};

const myQuickfixActions = {
  ...builtin.action.defaultQuickfixActions,
  // Install https://github.com/thinca/vim-qfreplace to use this action
  "quickfix:qfreplace": builtin.action.quickfix({
    after: "Qfreplace",
  }),
};

const myMiscActions = {
  ...builtin.action.defaultEchoActions,
  ...builtin.action.defaultYankActions,
  ...builtin.action.defaultSubmatchActions,
};

const myFilterFile = (path: string) => {
  const excludes = [
    ".7z",
    ".DS_Store",
    ".avi",
    ".avi",
    ".bmp",
    ".class",
    ".dll",
    ".dmg",
    ".doc",
    ".docx",
    ".dylib",
    ".ear",
    ".exe",
    ".fla",
    ".flac",
    ".flv",
    ".gif",
    ".ico",
    ".id_ed25519",
    ".id_rsa",
    ".iso",
    ".jar",
    ".jpeg",
    ".jpg",
    ".key",
    ".mkv",
    ".mov",
    ".mp3",
    ".mp4",
    ".mpeg",
    ".mpg",
    ".o",
    ".obj",
    ".ogg",
    ".pdf",
    ".png",
    ".ppt",
    ".pptx",
    ".rar",
    ".so",
    ".swf",
    ".tar.gz",
    ".war",
    ".wav",
    ".webm",
    ".wma",
    ".wmv",
    ".xls",
    ".xlsx",
    ".zip",
  ];
  for (const exclude of excludes) {
    if (path.endsWith(exclude)) {
      return false;
    }
  }
  return true;
};

const myFilterDirectory = (path: string) => {
  const excludes = [
    "$RECYVLE.BIN",
    ".cache",
    ".git",
    ".hg",
    ".ssh",
    ".svn",
    "__pycache__", // Python
    "build", // C/C++
    "node_modules", // Node.js
    "target", // Rust
  ];
  for (const exclude of excludes) {
    if (path.includes(`${SEPARATOR}${exclude}${SEPARATOR}`)) {
      return false;
    }
  }
  return true;
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
    theme: builtin.theme.MODERN_THEME,
  });

  defineItemPickerFromCurator(
    "git-grep",
    refineCurator(
      builtin.curator.gitGrep,
      builtin.refiner.relativePath,
    ),
    {
      previewers: [builtin.previewer.file],
      actions: {
        ...myPathActions,
        ...myQuickfixActions,
        ...myMiscActions,
      },
      defaultAction: "open",
    },
  );

  // Install https://github.com/BurntSushi/ripgrep to use this curator
  defineItemPickerFromCurator(
    "rg",
    refineCurator(
      builtin.curator.rg,
      builtin.refiner.relativePath,
    ),
    {
      previewers: [builtin.previewer.file],
      actions: {
        ...myPathActions,
        ...myQuickfixActions,
        ...myMiscActions,
      },
      defaultAction: "open",
    },
  );

  defineItemPickerFromSource(
    "file",
    refineSource(
      builtin.source.file({
        filterFile: myFilterFile,
        filterDirectory: myFilterDirectory,
      }),
      builtin.refiner.relativePath,
    ),
    {
      matchers: [builtin.matcher.fzf],
      renderers: [composeRenderers(
        builtin.renderer.smartPath,
        // Install https://www.nerdfonts.com/ to use this renderer
        builtin.renderer.nerdfont,
      )],
      previewers: [builtin.previewer.file],
      actions: {
        ...myPathActions,
        ...myQuickfixActions,
        ...myMiscActions,
      },
      defaultAction: "open",
    },
  );

  defineItemPickerFromSource(
    "file:all",
    refineSource(
      builtin.source.file,
      builtin.refiner.relativePath,
    ),
    {
      matchers: [builtin.matcher.fzf],
      renderers: [composeRenderers(
        builtin.renderer.smartPath,
        // Install https://www.nerdfonts.com/ to use this renderer
        builtin.renderer.nerdfont,
      )],
      previewers: [builtin.previewer.file],
      actions: {
        ...myPathActions,
        ...myQuickfixActions,
        ...myMiscActions,
      },
      defaultAction: "open",
    },
  );

  defineItemPickerFromSource("line", builtin.source.line, {
    matchers: [builtin.matcher.fzf],
    previewers: [builtin.previewer.buffer],
    actions: {
      ...myQuickfixActions,
      ...myMiscActions,
      ...builtin.action.defaultOpenActions,
      ...builtin.action.defaultBufferActions,
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
        ...myQuickfixActions,
        ...myMiscActions,
        ...builtin.action.defaultOpenActions,
        ...builtin.action.defaultBufferActions,
      },
      defaultAction: "open",
    },
  );

  defineItemPickerFromSource("help", builtin.source.helptag, {
    matchers: [builtin.matcher.fzf],
    previewers: [builtin.previewer.helptag],
    actions: {
      ...myMiscActions,
      ...builtin.action.defaultHelpActions,
    },
    defaultAction: "help",
  });
};
