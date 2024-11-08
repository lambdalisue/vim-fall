import type { IdItem } from "../../item.ts";
import type { Action } from "../../action.ts";
import { cmd } from "./cmd.ts";

type Detail = {
  helptag: string;
  lang?: string;
};

function attrGetter({ detail }: IdItem<Detail>): string {
  return detail.lang ? `${detail.helptag}@${detail.lang}` : detail.helptag;
}

export const help: Action<Detail> = cmd(
  {
    attrGetter,
    immediate: true,
    template: "help {}",
  },
);

export const defaultHelpActions: {
  help: Action<Detail>;
} = {
  help,
};
