import type { GetRenderer } from "jsr:@lambdalisue/vim-fall@0.6.0/renderer";
import { batch } from "https://deno.land/x/denops_std@v6.5.0/batch/mod.ts";
import { is } from "jsr:@core/unknownutil@3.18.0";

import { getByteLength } from "../util.ts";

const isExtensionDetail = is.ObjectOf({
  extension: is.ObjectOf({
    type: is.String,
    name: is.String,
    script: is.String,
    config: is.OptionalOf(is.Record),
  }),
});

export const getRenderer: GetRenderer = async (denops, _options) => {
  await batch(denops, async (denops) => {
    await denops.cmd(
      "highlight default FallExtensionLabelAction guifg=red gui=bold",
    );
    await denops.cmd(
      "highlight default FallExtensionLabelSource guifg=blue gui=bold",
    );
    await denops.cmd(
      "highlight default FallExtensionLabelProjector guifg=orange gui=bold",
    );
    await denops.cmd(
      "highlight default FallExtensionLabelRenderer guifg=green gui=bold",
    );
    await denops.cmd(
      "highlight default FallExtensionLabelPreviewer guifg=purple gui=bold",
    );
  });
  return {
    render({ items }, { signal }) {
      return items.map((v) => {
        signal?.throwIfAborted();
        if (!isExtensionDetail(v.detail)) {
          return v;
        }
        const { type, name } = v.detail.extension;
        const [prefix, highlight] = toLabel(type);
        return {
          ...v,
          label: `${prefix} ${name}`,
          decorations: [
            ...v.decorations,
            {
              column: 1,
              length: getByteLength(prefix),
              highlight,
            },
          ],
        };
      });
    },
  };
};

function toLabel(type: string): [string, string] {
  switch (type) {
    case "action":
      return ["A", "FallExtensionLabelAction"];
    case "source":
      return ["S", "FallExtensionLabelSource"];
    case "projector":
      return ["P", "FallExtensionLabelProjector"];
    case "renderer":
      return ["R", "FallExtensionLabelRenderer"];
    case "previewer":
      return ["V", "FallExtensionLabelPreviewer"];
    default:
      throw new Error(`Unknown type: ${type}`);
  }
}
