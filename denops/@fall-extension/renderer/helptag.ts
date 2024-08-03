import type { GetRenderer } from "jsr:@lambdalisue/vim-fall@^0.6.0/renderer";
import { as, is } from "jsr:@core/unknownutil@^4.0.0";

import { getByteLength } from "../util.ts";

const isHelptagDetail = is.ObjectOf({
  helptag: is.String,
  lang: as.Optional(is.String),
});

export const getRenderer: GetRenderer = (_denops, _options) => {
  return {
    render({ items }, { signal }) {
      return items.map((v) => {
        signal?.throwIfAborted();
        if (isHelptagDetail(v.detail) && v.detail.lang) {
          const label = v.label ?? v.value;
          const lang = v.detail.lang;
          return {
            ...v,
            label: `${label}@${lang}`,
            decorations: [
              ...v.decorations,
              {
                column: getByteLength(label) + 1,
                length: getByteLength(lang) + 1,
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
