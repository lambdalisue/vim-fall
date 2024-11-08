import type { IdItem } from "../../item.ts";
import type { Action } from "../../action.ts";
import { cmd } from "./cmd.ts";

type Detail = {
  path: string;
} | {
  bufname: string;
};

function attrGetter({ detail }: IdItem<Detail>): string {
  if ("path" in detail) {
    return detail.path;
  } else {
    return detail.bufname;
  }
}

export const cd: Action<Detail> = cmd({
  attrGetter,
  immediate: true,
  template: "cd {}",
  restriction: "directory-or-parent",
  fnameescape: true,
});

export const lcd: Action<Detail> = cmd({
  attrGetter,
  immediate: true,
  template: "lcd {}",
  restriction: "directory-or-parent",
  fnameescape: true,
});

export const tcd: Action<Detail> = cmd({
  attrGetter,
  immediate: true,
  template: "tcd {}",
  restriction: "directory-or-parent",
  fnameescape: true,
});

export const defaultCdActions: {
  cd: Action<Detail>;
  lcd: Action<Detail>;
  tcd: Action<Detail>;
} = {
  cd,
  lcd,
  tcd,
};
