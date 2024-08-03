import type { Denops } from "jsr:@denops/std@^7.0.0";
import type { GetAction } from "jsr:@lambdalisue/vim-fall@^0.6.0/action";
import * as fn from "jsr:@denops/std@^7.0.0/function";
import { input } from "jsr:@denops/std@^7.0.0/helper/input";
import { dirname } from "jsr:@std/path@^0.225.0/dirname";
import { assert, is, type Predicate } from "jsr:@core/unknownutil@^4.0.0";

import { retrieve } from "../util.ts";

type Restriction = "file" | "directory" | "directory-or-parent" | "buffer";

const isOptions = is.StrictOf(is.PartialOf(is.ObjectOf({
  // Attribute names to retrieve the value
  attrs: is.ArrayOf(is.String),

  // Execute the command immediately without confirmation
  immediate: is.Boolean,

  // Template of the command. `{}` will be replaced with the value of the item.
  template: is.String,

  // Restrict items that point to a file or a directory
  restriction: is.LiteralOneOf(
    [
      "file",
      "directory",
      "directory-or-parent",
      "buffer",
    ] as const,
  ) satisfies Predicate<Restriction>,

  // Escape the value of the item with `fnameescape()`
  fnameescape: is.Boolean,

  // Escape the value of the item with `shellescape()`
  shellescape: is.Boolean,
})));

export const getAction: GetAction = (denops, options) => {
  assert(options, isOptions);
  const attrs = options.attrs ?? ["value"];
  const immediate = options.immediate ?? false;
  const template = options.template ?? "{}";
  const restriction = options.restriction;
  const fnameescape = options.fnameescape ?? false;
  const shellescape = options.shellescape ?? false;
  return {
    description: "Execute command with the cursor or selected item(s)",

    invoke({ cursorItem, selectedItems }) {
      const items = selectedItems.length > 0
        ? selectedItems
        : cursorItem
        ? [cursorItem]
        : [];
      const inner = async () => {
        for (const item of items) {
          let value = retrieve(item, attrs, is.String);
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
            if (err instanceof DOMException && err.name === "AbortError") {
              return;
            }
            const m = err.message ?? err;
            console.warn(`[fall] Failed to execute '${cmd}': ${m}`);
          }
        }
      };
      // Execute action AFTER the picker is closed
      setTimeout(() => inner(), 0);
    },
  };
};

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
