import type { GetRenderer } from "jsr:@lambdalisue/vim-fall@0.6.0/renderer";
import { is } from "jsr:@core/unknownutil@3.18.0";

import { getByteLength } from "../util.ts";

const isDescriptionDetail = is.ObjectOf({
  description: is.String,
});

export const getRenderer: GetRenderer = (_denops, _options) => {
  return {
    render({ items }, { signal }) {
      return items.map((v) => {
        signal?.throwIfAborted();
        if (isDescriptionDetail(v.detail)) {
          const label = v.label ?? v.value;
          const description = v.detail.description;
          return {
            ...v,
            label: `${label}  ${description}`,
            decorations: [
              ...v.decorations,
              {
                column: getByteLength(label) + 2,
                length: getByteLength(description) + 1,
                highlight: "Comment",
              },
            ],
          };
        }
        return v;
      });
    },
  };
};
