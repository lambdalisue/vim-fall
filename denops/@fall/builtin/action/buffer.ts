import type { IdItem } from "../../item.ts";
import type { Action } from "../../action.ts";
import { cmd } from "./cmd.ts";

type Detail = {
  bufname: string;
} | {
  path: string;
};

function attrGetter({ detail }: IdItem<Detail>): string {
  if ("path" in detail) {
    return detail.path;
  } else {
    return detail.bufname;
  }
}

export const bunload: Action<Detail> = cmd({
  attrGetter,
  immediate: true,
  template: "bunload {}",
  restriction: "buffer",
  fnameescape: true,
});

export const bdelete: Action<Detail> = cmd({
  attrGetter,
  immediate: true,
  template: "bdelete {}",
  restriction: "buffer",
  fnameescape: true,
});

export const bwipeout: Action<Detail> = cmd({
  attrGetter,
  immediate: true,
  template: "bwipeout {}",
  restriction: "buffer",
  fnameescape: true,
});

export const write: Action<Detail> = cmd({
  attrGetter,
  immediate: true,
  template: "tabedit {} | write | tabclose",
  restriction: "buffer",
  fnameescape: true,
});

export const defaultBufferActions: {
  bunload: Action<Detail>;
  bdelete: Action<Detail>;
  bwipeout: Action<Detail>;
  write: Action<Detail>;
} = {
  bunload,
  bdelete,
  bwipeout,
  write,
};
