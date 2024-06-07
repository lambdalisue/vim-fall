import type { GetPreviewer } from "jsr:@lambdalisue/vim-fall@0.6.0/previewer";

import { getPreviewer as getAttrPreviewer } from "./attr.ts";
import { getPreviewer as getFilePreviewer } from "./file.ts";

export const getPreviewer: GetPreviewer = async (denops, options) => {
  const attrPreviewer = await getAttrPreviewer(denops, options);
  const filePreviewer = await getFilePreviewer(denops, options);
  return {
    async preview(params, options) {
      const attrPreview = await attrPreviewer.preview(params, options) ?? {
        content: [],
      };
      const filePreview = await filePreviewer.preview(params, options) ?? {
        content: [],
      };
      return {
        filetype: "markdown",
        content: [
          "# Options",
          "```json",
          ...attrPreview.content,
          "```",
          "",
          "# Source code",
          "```typescript",
          ...filePreview.content,
          "```",
        ],
        line: attrPreview.content.length + (filePreview.line ?? 0),
        column: attrPreview.column ?? 1,
      };
    },
  };
};
