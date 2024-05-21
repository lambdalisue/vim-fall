import type { Denops } from "https://deno.land/x/denops_std@v6.3.0/mod.ts";

import type { FlatType, Promish } from "./_common.ts";
import type { Item } from "./item.ts";

export type SourceItem = FlatType<
  & Pick<Item, "value" | "label">
  & Partial<Pick<Item, "detail" | "decorations">>
>;

export type SourceParams = {
  /**
   * The cmdline argument passed to the picker.
   *
   * For example, if user starts a picker with `Fall line -v ./README.md`, the `line` source
   * will be invoked with the cmdline `-v ./README.md`.
   */
  readonly cmdline: string;
};

/**
 * Source is a provider of items for the picker.
 *
 * The source is invoked when the picker is started.
 */
export type Source = {
  /**
   * Description of the extension.
   */
  readonly description?: string;

  /**
   * Get the stream of items.
   *
   * This method is called when the picker is started.
   * The returned stream is used to retrieve items in the background.
   *
   * @param params The source parameters.
   */
  readonly stream: (
    params: SourceParams,
  ) => Promish<ReadableStream<SourceItem>>;

  /**
   * Get the completion candidates.
   *
   * This method is called when the user try to complete source arguments.
   *
   * @param arglead The leading string of the argument.
   * @param cmdline The whole command line.
   * @param cursorpos The cursor position in the command line.
   */
  readonly complete?: (
    arglead: string,
    cmdline: string,
    cursorpos: number,
  ) => Promish<readonly string[]>;
};

/**
 * Get the source instance.
 *
 * This function is called when the picker is started.
 *
 * @param denops The Denops instance.
 * @param options The options of the extension.
 */
export type GetSource = (
  denops: Denops,
  options: Readonly<Record<string, unknown>>,
) => Promish<Source>;
