import type { Denops } from "https://deno.land/x/denops_std@v6.3.0/mod.ts";

import type { Promish } from "./_common.ts";
import type { Item } from "./item.ts";

export type { Item };

export type TransformerParams = Readonly<{
  /**
   * The query that user has input.
   */
  query: string;
}>;

/**
 * Transformer is responsible for transforming the stream of the items.
 *
 * It is mainly designed for item modification or filteration that does not require entire items
 * prior to perform operation. Use `Projector` instead when you want to apply the operation on
 * the entire items rather than the stream.
 */
export type Transformer = Readonly<{
  /**
   * Description of the extension.
   */
  readonly description?: string;

  /**
   * Get the transform stream to transform the stream of the items.
   *
   * This method is called every after when the user changes the query in the picker prompt.
   * If the method returns `undefined`, the no transformation of the transformer is applied.
   *
   * @param params The transformer parameters.
   * @param options.signal The signal to abort the transformer.
   */
  readonly transform: (
    params: TransformerParams,
    options: { signal?: AbortSignal },
  ) => Promish<TransformStream<Item, Item> | undefined>;
}>;

/**
 * Get the transformer instance.
 *
 * This function is called when the picker is started.
 *
 * @param denops The Denops instance.
 * @param options The options of the extension.
 */
export type GetTransformer = (
  denops: Denops,
  options: Readonly<Record<string, unknown>>,
) => Promish<Transformer>;
