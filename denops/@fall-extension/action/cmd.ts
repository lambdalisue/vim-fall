import type { Denops } from "https://deno.land/x/denops_std@v6.4.0/mod.ts";
import type { GetAction } from "jsr:@lambdalisue/vim-fall@0.6.0/action";
import { input } from "https://deno.land/x/denops_std@v6.4.0/helper/input.ts";
import { assert, is } from "jsr:@core/unknownutil@3.18.0";

const description = `
Invoke Vim command (item.value) with the cursor or selected item(s).

# Options

- immediate (boolean): Execute the command immediately without prompting the user. Default is false.
- prefix (string): Prefix string to add before the value. Default is ''.
- suffix (string): Suffix string to add after the value. Default is ''.
`.trim();

const isOptions = is.StrictOf(is.PartialOf(is.ObjectOf({
  immediate: is.Boolean,
  prefix: is.String,
  suffix: is.String,
})));

export const getAction: GetAction = (denops, options) => {
  assert(options, isOptions);
  const immediate = options.immediate ?? false;
  const prefix = options.prefix ?? "";
  const suffix = options.suffix ?? "";
  return {
    description,

    invoke({ cursorItem, selectedItems }) {
      const items = selectedItems.length > 0
        ? selectedItems
        : cursorItem
        ? [cursorItem]
        : [];
      const inner = async () => {
        for (const item of items) {
          const cmd = `${prefix}${item.value}${suffix}`;
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
