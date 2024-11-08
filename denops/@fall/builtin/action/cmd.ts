import type { Denops } from "jsr:@denops/std@^7.3.0";
import * as fn from "jsr:@denops/std@^7.0.0/function";
import { input } from "jsr:@denops/std@^7.0.0/helper/input";
import { dirname } from "jsr:@std/path@^1.0.0/dirname";

import type { IdItem } from "../../item.ts";
import { type Action, defineAction } from "../../action.ts";

type Restriction = "file" | "directory" | "directory-or-parent" | "buffer";

type Options<T> = {
  attrGetter?: (item: IdItem<T>) => string | undefined;
  immediate?: boolean;
  template?: string;
  restriction?: Restriction;
  fnameescape?: boolean;
  shellescape?: boolean;
};

export function cmd<T>(options: Options<T> = {}): Action<T> {
  const attrGetter = options.attrGetter ?? ((item) => item.value);
  const immediate = options.immediate ?? false;
  const template = options.template ?? "{}";
  const restriction = options.restriction;
  const fnameescape = options.fnameescape ?? false;
  const shellescape = options.shellescape ?? false;
  return defineAction<T>(
    async (denops, { item, selectedItems }, { signal }) => {
      const items = selectedItems ?? [item];
      for (const item of items.filter((v) => !!v)) {
        signal?.throwIfAborted();
        let value = attrGetter(item);
        if (value == undefined) continue;
        if (restriction) {
          value = await applyRestriction(denops, value, restriction);
          if (value == undefined) continue;
        }
        if (fnameescape) {
          value = await fn.fnameescape(denops, value);
        }
        if (shellescape) {
          value = await fn.shellescape(denops, value);
        }
        const cmd = template.replaceAll("{}", value);
        try {
          await execute(denops, cmd, immediate);
        } catch (err) {
          console.warn(`[fall] Failed to execute '${cmd}':`, err);
        }
      }
    },
  );
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

export const defaultCmdActions: {
  cmd: Action<unknown>;
} = {
  cmd: cmd(),
};
