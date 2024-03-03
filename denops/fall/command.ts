import type { Denops } from "https://deno.land/x/denops_std@v6.3.0/mod.ts";
import {
  parseFlags,
  validateFlags,
} from "https://deno.land/x/denops_std@v6.3.0/argument/mod.ts";

import { start } from "./start.ts";

export async function startCommand(
  denops: Denops,
  cmdargs: string[],
): Promise<void> {
  const [flags, residues] = parseFlags(cmdargs);
  if (residues.length < 1) {
    throw new Error("Source name is required");
  }
  const [name, ...args] = residues;

  validateFlags(flags, [
    "f",
    "filter",
    "s",
    "sorter",
    "p",
    "presenter",
    "v",
    "previewer",
    "a",
    "action",
    "F",
    "action-filter",
    "S",
    "action-sorter",
    "P",
    "action-presenter",
  ]);

  const filters = toStringArray(flags.f ?? flags.filter);
  const sorters = toStringArray(flags.s ?? flags.sorter);
  const presenters = toStringArray(flags.p ?? flags.presenter);
  const previewer = toString(flags.v ?? flags.previewer);
  const actions = toStringArray(flags.a ?? flags.action);
  const actionFilters = toStringArray(flags.F ?? flags["action-filter"]);
  const actionSorters = toStringArray(flags.S ?? flags["action-sorter"]);
  const actionPresenters = toStringArray(flags.P ?? flags["action-presenter"]);

  await start(denops, name, {
    args,
    filters,
    sorters,
    presenters,
    previewer,
    actions,
    actionFilters,
    actionSorters,
    actionPresenters,
  });
}

function toString(value: string | string[] | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  return Array.isArray(value) ? value.at(-1) : value;
}

function toStringArray(
  value: string | string[] | undefined,
): string[] | undefined {
  if (value === undefined) {
    return undefined;
  }
  return Array.isArray(value) ? value : [value];
}
