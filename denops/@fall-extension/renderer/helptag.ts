import type { GetRenderer } from "../../@fall/renderer.ts";
import { is } from "jsr:@core/unknownutil@3.18.0";

import { getByteLength } from "../util.ts";

const isHelptagDetail = is.ObjectOf({
  helptag: is.String,
  lang: is.OptionalOf(is.String),
});

export const getRenderer: GetRenderer = (_denops, _options) => {
  return {
    render({ items }) {
      return items.map((v) => {
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
