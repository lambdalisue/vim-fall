import type { GetSource } from "jsr:@lambdalisue/vim-fall@0.6.0/source";
import { as, assert, is } from "jsr:@core/unknownutil@^4.0.0";

const isSourceItem = is.ObjectOf({
  value: is.String,
  label: as.Optional(is.String),
  detail: as.Optional(is.RecordOf(is.Unknown, is.String)),
});

const isOptions = is.StrictOf(is.ObjectOf({
  items: is.ArrayOf(isSourceItem),
}));

export const getSource: GetSource = (_denops, options) => {
  assert(options, isOptions);
  const items = options.items;
  return {
    stream() {
      return ReadableStream.from(items);
    },
  };
};
