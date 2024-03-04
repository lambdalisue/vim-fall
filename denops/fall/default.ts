import type { SetupParams } from "./setup.ts";

export const defaultParams: SetupParams = {
  picker: {
    items: {
      "line": {
        sorters: [],
        presenters: [],
      },
    },
  },
  sources: {
    list: {
      uri: "builtin:sources/list.ts",
      options: {
        items: [
          { value: "a" },
          { value: "b" },
          { value: "c" },
        ],
      },
    },
    line: {
      uri: "builtin:sources/line.ts",
    },
    file: {
      uri: "builtin:sources/file.ts",
      options: {
        excludes: [
          "/node_modules/",
          "/.git/",
          "/.DS_Store",
          "/Desktop.ini",
          "/Thumbs.db",
        ],
      },
    },
  },
  actions: {
    debug: {
      uri: "builtin:actions/debug.ts",
    },
    echo: {
      uri: "builtin:actions/echo.ts",
    },
    open: {
      uri: "builtin:actions/open.ts",
    },
    "open:split": {
      uri: "builtin:actions/open.ts",
      options: {
        opener: "split",
      },
    },
    "open:vsplit": {
      uri: "builtin:actions/open.ts",
      options: {
        opener: "vsplit",
      },
    },
    "open:edit-split": {
      uri: "builtin:actions/open.ts",
      options: {
        opener: "edit",
        splitter: "split",
      },
    },
    "open:edit-vsplit": {
      uri: "builtin:actions/open.ts",
      options: {
        opener: "edit",
        splitter: "vsplit",
      },
    },
  },
  filters: {
    null: {
      uri: "builtin:filters/null.ts",
    },
    substring: {
      uri: "builtin:filters/substring.ts",
    },
  },
  sorters: {
    null: {
      uri: "builtin:sorters/null.ts",
    },
    lexical: {
      uri: "builtin:sorters/lexical.ts",
    },
    "lexical:desc": {
      uri: "builtin:sorters/lexical.ts",
      options: {
        direction: "desc",
      },
    },
  },
  presenters: {
    null: {
      uri: "builtin:presenters/null.ts",
    },
  },
  previewers: {
    null: {
      uri: "builtin:previewers/null.ts",
    },
    path: {
      uri: "builtin:previewers/path.ts",
    },
  },
};
