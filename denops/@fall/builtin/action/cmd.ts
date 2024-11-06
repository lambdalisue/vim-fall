import type { Denops } from "jsr:@denops/std@^7.3.0";
import * as fn from "jsr:@denops/std@^7.0.0/function";
import { input } from "jsr:@denops/std@^7.0.0/helper/input";
import { dirname } from "jsr:@std/path@^1.0.0/dirname";

import type { IdItem } from "../../item.ts";
import type { Action, InvokeParams } from "../../action.ts";

type Restriction = "file" | "directory" | "directory-or-parent" | "buffer";

type Options<T> = {
  attrGetter?: (item: IdItem<T>) => string | undefined;
  immediate?: boolean;
  template?: string;
  restriction?: Restriction;
  fnameescape?: boolean;
  shellescape?: boolean;
};

export class CmdAction<T> implements Action<T> {
  #attrGetter: (item: IdItem<T>) => string | undefined;
  #immediate: boolean;
  #template: string;
  #restriction?: "file" | "directory" | "directory-or-parent" | "buffer";
  #fnameescape: boolean;
  #shellescape: boolean;

  constructor(options: Options<T> = {}) {
    this.#attrGetter = options.attrGetter ?? ((item) => item.value);
    this.#immediate = options.immediate ?? false;
    this.#template = options.template ?? "{}";
    this.#restriction = options.restriction;
    this.#fnameescape = options.fnameescape ?? false;
    this.#shellescape = options.shellescape ?? false;
  }

  async invoke(
    denops: Denops,
    { item, selectedItems }: InvokeParams<T>,
    { signal }: { signal?: AbortSignal },
  ): Promise<void> {
    const items = selectedItems ?? [item];
    for (const item of items.filter((v) => !!v)) {
      signal?.throwIfAborted();
      let value = this.#attrGetter(item);
      if (value == undefined) continue;
      if (this.#restriction) {
        value = await applyRestriction(denops, value, this.#restriction);
        if (value == undefined) continue;
      }
      if (this.#fnameescape) {
        value = await fn.fnameescape(denops, value);
      }
      if (this.#shellescape) {
        value = await fn.shellescape(denops, value);
      }
      const cmd = this.#template.replaceAll("{}", value);
      try {
        await execute(denops, cmd, this.#immediate);
      } catch (err) {
        console.warn(`[fall] Failed to execute '${cmd}':`, err);
      }
    }
  }
}

async function applyRestriction(
  denops: Denops,
  value: string,
  restriction: Restriction,
): Promise<string | undefined> {
  switch (restriction) {
    case "file":
    case "directory":
    case "directory-or-parent": {
      try {
        const stat = await Deno.stat(value);
        switch (restriction) {
          case "file":
            if (stat.isFile) {
              return value;
            }
            break;
          case "directory":
            if (stat.isDirectory) {
              return value;
            }
            break;
          case "directory-or-parent":
            if (!stat.isDirectory) {
              value = dirname(value);
            }
            return value;
        }
      } catch (err) {
        if (!(err instanceof Deno.errors.NotFound)) {
          throw err;
        }
      }
      return;
    }
    case "buffer": {
      if (!await fn.bufloaded(denops, value)) {
        return;
      }
      return value;
    }
  }
}

async function execute(
  denops: Denops,
  cmd: string,
  immediate: boolean,
): Promise<void> {
  const command = immediate ? cmd : await input(denops, {
    prompt: ":",
    text: cmd,
    completion: "command",
  });
  if (command == null) {
    // Cancelled
    return;
  }
  await denops.cmd(command);
}

export const cdAction: { cd: CmdAction<unknown> } = {
  cd: new CmdAction({
    immediate: true,
    template: "cd {}",
    restriction: "directory-or-parent",
    fnameescape: true,
  }),
};

export const lcdAction: { lcd: CmdAction<unknown> } = {
  lcd: new CmdAction({
    immediate: true,
    template: "lcd {}",
    restriction: "directory-or-parent",
    fnameescape: true,
  }),
};

export const tcdAction: { tcd: CmdAction<unknown> } = {
  tcd: new CmdAction({
    immediate: true,
    template: "tcd {}",
    restriction: "directory-or-parent",
    fnameescape: true,
  }),
};

export const cdActions = {
  ...cdAction,
  ...lcdAction,
  ...tcdAction,
};

export const bunloadAction: { bunload: CmdAction<unknown> } = {
  bunload: new CmdAction({
    immediate: true,
    template: "bunload {}",
    restriction: "buffer",
    fnameescape: true,
  }),
};

export const bdeleteAction: { bdelete: CmdAction<unknown> } = {
  bdelete: new CmdAction({
    immediate: true,
    template: "bdelete {}",
    restriction: "buffer",
    fnameescape: true,
  }),
};

export const bwipeoutAction: { bwipeout: CmdAction<unknown> } = {
  bwipeout: new CmdAction({
    immediate: true,
    template: "bdelete {}",
    restriction: "buffer",
    fnameescape: true,
  }),
};

export const bufferActions = {
  ...bunloadAction,
  ...bdeleteAction,
  ...bwipeoutAction,
};

export const helpAction: { help: CmdAction<unknown> } = {
  help: new CmdAction({
    immediate: true,
    template: "help {}",
  }),
};

export const writeAction: { write: CmdAction<unknown> } = {
  write: new CmdAction({
    immediate: true,
    template: "tabedit {} | write | tabclose",
    restriction: "buffer",
    fnameescape: true,
  }),
};
