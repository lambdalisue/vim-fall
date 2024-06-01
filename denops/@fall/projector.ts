import type { Denops } from "jsr:@denops/core@6.1.0";

import type { Promish } from "./_common.ts";
import type { Item } from "./item.ts";

export type { Item };

export type ProjectorParams = {
  /**
   * The query that user has input.
   */
  readonly query: string;

  /**
   * The transformed/projected items.
   */
  readonly items: readonly Item[];
};

/**
 * Projector is responsible for projection of the items.
 *
 * It is mainly designed for item modification, filteration, or sort that requires entire items
 * prior to perform the operation.
 */
export type Projector = {
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
  readonly project: (
    params: ProjectorParams,
    options: { signal?: AbortSignal },
  ) => Promish<readonly Item[]>;
};

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
  options: Readonly<Record<string, unknown>>,
) => Promish<Projector>;
