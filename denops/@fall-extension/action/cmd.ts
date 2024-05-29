import type { GetAction } from "../../@fall/action.ts";
import { assert, is } from "jsr:@core/unknownutil@3.18.0";

const description = `
Invoke Vim command with the cursor or selected item(s).
`.trim();

const DEFAULT_PLACEHOLDER = "{}";

const isOptions = is.StrictOf(is.PartialOf(is.ObjectOf({
  command: is.String,
  placeholder: is.String,
})));

export const getAction: GetAction = (denops, options) => {
  assert(options, isOptions);
  const placeholder = options.placeholder ?? DEFAULT_PLACEHOLDER;
  const command = options.command ?? `echomsg '${placeholder}'`;
  if (!command.includes(placeholder)) {
    throw new Error(
      `The 'command' option must contain the placeholder '${placeholder}' but got '${command}'`,
    );
  }
  return {
    description,

    async invoke({ cursorItem, selectedItems }) {
      const items = selectedItems.length > 0
        ? selectedItems
        : cursorItem
        ? [cursorItem]
        : [];
      for (const item of items) {
        const cmd = command.replace(placeholder, item.value);
        try {
          await denops.cmd(cmd);
        } catch (err) {
          if (err instanceof DOMException && err.name === "AbortError") return;
          const m = err.message ?? err;
          console.warn(`[fall] Failed to execute '${cmd}': ${m}`);
        }
      }
    },
  };
};
