import type {
  Processor,
  ProcessorItem,
} from "https://deno.land/x/fall_core@v0.3.0/mod.ts";
import { assert, is } from "https://deno.land/x/unknownutil@v3.16.3/mod.ts";

const isOptions = is.StrictOf(is.PartialOf(is.ObjectOf({
  reverse: is.Boolean,
})));

export function getProcessor(
  options: Record<string, unknown>,
): Processor {
  assert(options, isOptions);
  const alpha = options.reverse ? -1 : 1;
  return {
    getStream: (_denops) => {
      const items: ProcessorItem[] = [];
      return new TransformStream({
        transform(chunk) {
          items.push(chunk);
        },
        flush(controller) {
          items.sort((a, b) => {
            return a.value.localeCompare(b.value) * alpha;
          });
          items.forEach((item) => controller.enqueue(item));
        },
      });
    },
  };
}
