import type { Denops } from "https://deno.land/x/denops_std@v6.4.0/mod.ts";

import {
  BORDER_B,
  BORDER_BL,
  BORDER_BR,
  BORDER_L,
  BORDER_R,
  BORDER_T,
  BORDER_TL,
  BORDER_TR,
  getBorder,
  getDefaultBorder,
} from "../util/border.ts";
import {
  DIVIDER_H,
  DIVIDER_L,
  DIVIDER_R,
  getDefaultDivider,
  getDivider,
} from "../util/divider.ts";
import {
  type Options as QueryComponentOptions,
  QueryComponent,
} from "./query.ts";
import { SelectComponent } from "./select.ts";
import { PreviewComponent } from "./preview.ts";
import { Component, type Layout, type Options as OpenOptions } from "./base.ts";

type Options = QueryComponentOptions & {
  readonly previewRatio: number;
};

export class PickerComponent implements Component {
  protected readonly name = "picker";

  readonly #previewRatio: number;
  readonly #query: QueryComponent;
  readonly #select: SelectComponent;
  readonly #preview: PreviewComponent;

  constructor(options: Options) {
    this.#previewRatio = options.previewRatio;
    this.#query = new QueryComponent(options);
    this.#select = new SelectComponent();
    this.#preview = new PreviewComponent();
  }

  get query(): QueryComponent {
    return this.#query;
  }

  get select(): SelectComponent {
    return this.#select;
  }

  get preview(): PreviewComponent {
    return this.#preview;
  }

  async open(
    denops: Denops,
    layout: Layout,
    options: OpenOptions,
  ): Promise<AsyncDisposable> {
    const border = getBorder(options.border ?? await getDefaultBorder(denops));
    const divider = getDivider(
      options.divider ?? await getDefaultDivider(denops),
    );
    const { queryLayout, selectLayout, previewLayout } = calcLayout(layout, {
      previewRatio: this.#previewRatio,
    });
    await using stack = new AsyncDisposableStack();
    stack.use(
      await this.#preview.open(denops, previewLayout, {
        border: [
          border[BORDER_TL],
          border[BORDER_T],
          border[BORDER_TR],
          border[BORDER_R],
          border[BORDER_BR],
          border[BORDER_B],
          border[BORDER_BL],
          border[BORDER_L],
        ],
        zindex: options.zindex,
      }),
    );
    stack.use(
      await this.#query.open(denops, queryLayout, {
        title: options.title,
        border: [
          border[BORDER_TL],
          border[BORDER_T],
          border[BORDER_TR],
          border[BORDER_R],
          divider[DIVIDER_R],
          divider[DIVIDER_H],
          divider[DIVIDER_L],
          border[BORDER_L],
        ],
        zindex: options.zindex,
      }),
    );
    stack.use(
      await this.#select.open(denops, selectLayout, {
        border: [
          "",
          "",
          "",
          border[BORDER_R],
          border[BORDER_BR],
          border[BORDER_B],
          border[BORDER_BL],
          border[BORDER_L],
        ],
        zindex: options.zindex,
      }),
    );
    return stack.move();
  }

  async move(denops: Denops, layout: Layout): Promise<void> {
    const { queryLayout, selectLayout, previewLayout } = calcLayout(layout, {
      previewRatio: this.#previewRatio,
    });
    await this.#query.move(denops, queryLayout);
    await this.#select.move(denops, selectLayout);
    await this.#preview.move(denops, previewLayout);
  }

  async render(
    denops: Denops,
    { signal }: { signal: AbortSignal },
  ): Promise<void | true> {
    return [
        await this.#query.render(denops, { signal }),
        await this.#select.render(denops, { signal }),
        await this.#preview.render(denops, { signal }),
      ].every((v) => v === true)
      ? true
      : undefined;
  }

  movePreviewCursor(
    denops: Denops,
    offset: number,
    { signal }: { signal: AbortSignal },
  ): Promise<void> {
    return this.#preview.moveCursor(denops, offset, { signal });
  }

  movePreviewCursorAt(
    denops: Denops,
    line: number,
    { signal }: { signal: AbortSignal },
  ): Promise<void> {
    return this.#preview.moveCursorAt(denops, line, { signal });
  }
}

/**
 * ```
 *                 width
 * ┌─────────────────────────────────────┐
 *
 * ╭──────────────────────╮╭─────────────╮  ┐
 * │        Query         ││             │  │
 * │----------------------││             │  │
 * │                      ││   Preview   │  │height
 * │        Select        ││             │  │
 * │                      ││             │  │
 * ╰──────────────────────╯╰─────────────╯  ┘
 *
 * └──────────────────────┘└─────────────┘
 *        mainWidth         previewWidth
 * ```
 */
function calcLayout(
  { width, height, col, row }: Layout,
  { previewRatio }: {
    readonly previewRatio: number;
  },
): {
  readonly queryLayout: Layout;
  readonly selectLayout: Layout;
  readonly previewLayout: Layout;
} {
  const previewWidth = Math.floor(Math.min(
    width,
    Math.max(0, width * previewRatio),
  ));
  const mainWidth = width - previewWidth;
  return {
    queryLayout: {
      col,
      row,
      width: mainWidth - 2, // -2 for border
      height: 1,
    },
    selectLayout: {
      col,
      row: row + 3, // +3 for query and border
      width: mainWidth - 2, // -2 for border
      height: height - 1 - 3, // -1 for query, -3 for border
    },
    previewLayout: {
      col: col + mainWidth,
      row,
      width: previewWidth - 2, // -2 for border
      height: height - 2, // -2 for border
    },
  };
}
