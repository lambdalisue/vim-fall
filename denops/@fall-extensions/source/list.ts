import { type Source } from "https://deno.land/x/fall_core@v0.8.0/mod.ts";
import { assert, is } from "jsr:@core/unknownutil@3.18.0";

const isSourceItem = is.ObjectOf({
  value: is.String,
  label: is.OptionalOf(is.String),
  detail: is.OptionalOf(is.RecordOf(is.Unknown, is.String)),
});

const isOptions = is.StrictOf(is.ObjectOf({
  items: is.ArrayOf(isSourceItem),
}));

export function getSource(
  options: Record<string, unknown>,
): Source {
  assert(options, isOptions);
  const items = options.items;
  return {
    getStream: (_denops, _cmdline) => {
      return ReadableStream.from(items);
    },
  };
}
