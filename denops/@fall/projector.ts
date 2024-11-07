import type { Denops } from "jsr:@denops/std@^7.3.0";

import type { LastType } from "./_typeutil.ts";
import type { IdItem } from "./item.ts";
import type { CollectParams, Source } from "./source.ts";
import type { CurateParams, Curator } from "./curator.ts";

export type ProjectParams<T> = {
  /**
   * Items to project.
   */
  readonly items: AsyncIterable<IdItem<T>>;
};

export type Projector<T, U = T> = {
  /**
   * Project items.
   *
   * @param denops Denops instance.
   * @param params Parameters to match items.
   * @param options Options.
   */
  project(
    denops: Denops,
    params: ProjectParams<T>,
    options: { signal?: AbortSignal },
  ): AsyncIterableIterator<IdItem<U>>;
};

/**
 * Compose projectors into a source/curator to create a new source/curator.
 */
export function compose<
  S extends Source<unknown> | Curator<unknown>,
  P extends Projector<unknown, unknown>[],
  T extends S extends Source<infer T> ? T
    : S extends Curator<infer T> ? T
    : never,
  U extends LastType<P> extends Projector<infer _, infer U> ? U : never,
  R extends S extends Source<unknown> ? Source<U> : Curator<U>,
>(source: S, ...projector: P): R {
  if ("collect" in source) {
    return projectSource(source as Source<T>, ...projector) as R;
  } else {
    return projectCurator(source as Curator<T>, ...projector) as R;
  }
}

function projectSource<
  T,
  P extends Projector<unknown, unknown>[],
  U extends LastType<P> extends Projector<infer _, infer U> ? U : never,
>(
  source: Source<T>,
  ...projectors: P
): Source<U> {
  return {
    collect: (
      denops: Denops,
      params: CollectParams,
      options: { signal?: AbortSignal },
    ) => {
      // deno-lint-ignore no-explicit-any
      let it: AsyncIterableIterator<IdItem<any>> = source.collect(
        denops,
        params,
        options,
      );
      for (const projector of projectors) {
        it = projector.project(denops, { items: it }, options);
      }
      return it;
    },
  };
}

function projectCurator<
  T,
  P extends Projector<unknown, unknown>[],
  U extends LastType<P> extends Projector<infer _, infer U> ? U : never,
>(
  curator: Curator<T>,
  ...projectors: P
): Curator<U> {
  return {
    curate: (
      denops: Denops,
      params: CurateParams,
      options: { signal?: AbortSignal },
    ) => {
      // deno-lint-ignore no-explicit-any
      let it: AsyncIterableIterator<IdItem<any>> = curator.curate(
        denops,
        params,
        options,
      );
      for (const projector of projectors) {
        it = projector.project(denops, { items: it }, options);
      }
      return it;
    },
  };
}
