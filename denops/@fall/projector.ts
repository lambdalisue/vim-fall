import type { Denops } from "https://deno.land/x/denops_std@v6.3.0/mod.ts";

import type { Promish } from "./_common.ts";
import type { Item } from "./item.ts";

export type { Item };

export interface ProjectorParams {
  /**
   * The query that user has input.
   */
  query: string;

  /**
   * The transformed/projected items.
   */
  items: Item[];
}

/**
 * Projector is responsible for projection of the items.
 *
 * It is mainly designed for item modification, filteration, or sort that requires entire items
 * prior to perform the operation. Use `Transformer` instead when you want to apply the operation
 * on the stream rather than the entire items.
 */
export interface Projector {
  /**
   * Description of the extension.
   */
  readonly description?: string;

  /**
   * Project the transformed/projected items.
   *
   * This method is called every after when the user changes the query in the picker prompt.
   *
   * @param params The sorter parameters.
   * @param options.signal The signal to abort the projection.
   */
  project: (
    params: ProjectorParams,
    options: { signal?: AbortSignal },
  ) => Promish<Item[]>;
}

/**
 * Get the projector instance.
 *
 * This function is called when the picker is started.
 *
 * @param denops The Denops instance.
 * @param options The options of the extension.
 */
export type GetProjector = (
  denops: Denops,
  options: Record<string, unknown>,
) => Promish<Projector>;
