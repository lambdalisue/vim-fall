import type { GetTransformer } from "../../@fall/transformer.ts";
import * as fn from "https://deno.land/x/denops_std@v6.4.0/function/mod.ts";
import { relative } from "jsr:@std/path@0.225.0/relative";
import { is } from "jsr:@core/unknownutil@3.18.0";

const isPathDetail = is.ObjectOf({
  path: is.String,
});

export const getTransformer: GetTransformer = async (denops, _options) => {
  const cwd = await fn.getcwd(denops);
  return {
    transform() {
      return new TransformStream({
        transform(chunk, controller) {
          if (isPathDetail(chunk.detail)) {
            const path = relative(cwd, chunk.detail.path);
            if (chunk.value === chunk.detail.path) {
              controller.enqueue({
                ...chunk,
                detail: {
                  ...chunk.detail,
                  path,
                },
                value: path,
              });
            } else {
              controller.enqueue({
                ...chunk,
                detail: {
                  ...chunk.detail,
                  path,
                },
              });
            }
          } else {
            controller.enqueue(chunk);
          }
        },
      });
    },
  };
};
