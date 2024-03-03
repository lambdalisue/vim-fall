import type { Denops } from "https://deno.land/x/denops_std@v6.3.0/mod.ts";
import { ensure, is } from "https://deno.land/x/unknownutil@v3.16.3/mod.ts";
import { isSetupParams, setup } from "./setup.ts";
import { isStartOptions, start } from "./start.ts";
import { startCommand } from "./command.ts";
import { defaultParams } from "./default.ts";

let initialized = false;

export function main(denops: Denops): void {
  denops.dispatcher = {
    "setup": (params) => {
      init(denops);
      setup(denops, ensure(params, isSetupParams));
    },
    "start": async (name, options) => {
      init(denops);
      await start(
        denops,
        ensure(name, is.String),
        ensure(options, isStartOptions),
      );
    },
    "startCommand": async (cmdargs) => {
      init(denops);
      await startCommand(
        denops,
        ensure(cmdargs, is.ArrayOf(is.String)),
      );
    },
    "select": () => {
      dispatchEvent(new CustomEvent("fall:select"));
    },
    "sorterNext": () => {
      dispatchEvent(new CustomEvent("fall:sorter-next"));
    },
    "sorterPrevious": () => {
      dispatchEvent(new CustomEvent("fall:sorter-previous"));
    },
    "cursorNext": () => {
      dispatchEvent(new CustomEvent("fall:cursor-next"));
    },
    "cursorPrevious": () => {
      dispatchEvent(new CustomEvent("fall:cursor-previous"));
    },
    "previewNext": () => {
      dispatchEvent(new CustomEvent("fall:preview-next"));
    },
    "previewPrevious": () => {
      dispatchEvent(new CustomEvent("fall:preview-previous"));
    },
    "actionSelect": () => {
      dispatchEvent(new CustomEvent("fall:action-select"));
    },
    "actionDefault": () => {
      dispatchEvent(new CustomEvent("fall:action-default"));
    },
    "actionInvoke": (name) => {
      dispatchEvent(new CustomEvent("fall:action-invoke", { detail: name }));
    },
  };
}

function init(denops: Denops): void {
  if (initialized) return;
  initialized = true;
  setup(denops, defaultParams);
}

declare global {
  interface WindowEventMap {
    "fall:select": CustomEvent;
    "fall:sorter-next": CustomEvent;
    "fall:sorter-previous": CustomEvent;
    "fall:cursor-next": CustomEvent;
    "fall:cursor-previous": CustomEvent;
    "fall:preview-next": CustomEvent;
    "fall:preview-previous": CustomEvent;
    "fall:action-select": CustomEvent;
    "fall:action-default": CustomEvent;
    "fall:action-invoke": CustomEvent<string>;
  }
}
