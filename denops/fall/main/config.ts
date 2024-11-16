import type { Entrypoint } from "jsr:@denops/std@^7.3.2";
import { as, assert, is } from "jsr:@core/unknownutil@^4.3.0";

import {
  editUserConfig,
  loadUserConfig,
  recacheUserConfig,
} from "../config.ts";

export const main: Entrypoint = (denops) => {
  denops.dispatcher = {
    ...denops.dispatcher,
    "config:edit": (options = {}) => {
      assert(options, isEditOptions);
      return editUserConfig(denops, options);
    },
    "config:reload": (options = {}) => {
      assert(options, isReloadOptions);
      return loadUserConfig(denops, { verbose: options.verbose, reload: true });
    },
    "config:recache": () => {
      return recacheUserConfig(denops, { signal: denops.interrupted });
    },
  };
};

const isEditOptions = is.ObjectOf({
  bang: as.Optional(is.Boolean),
  mods: as.Optional(is.String),
  opener: as.Optional(is.String),
  cmdarg: as.Optional(is.String),
});

const isReloadOptions = is.ObjectOf({
  verbose: as.Optional(is.Boolean),
});
