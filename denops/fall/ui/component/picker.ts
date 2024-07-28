import type { Denops } from "jsr:@denops/std@7.0.0";

import {
  type Border,
  BORDER_B,
  BORDER_BL,
  BORDER_BR,
  BORDER_L,
  BORDER_R,
  BORDER_T,
  BORDER_TL,
  BORDER_TR,
  getBorder,
} from "../util/border.ts";
import {
  type Divider,
  DIVIDER_H,
  DIVIDER_L,
  DIVIDER_R,
  getDivider,
} from "../util/divider.ts";
import {
  type Params as QueryComponentOptions,
  QueryComponent,
} from "./query.ts";
import { SelectComponent } from "./select.ts";
import { PreviewComponent } from "./preview.ts";
import type { Component, Layout } from "./base.ts";

type Params = QueryComponentOptions & {
  readonly previewRatio: number;
  readonly previewMode: "fast" | "correct";
  readonly title?: string;
  readonly border: Border;
  readonly divider: Divider;
  readonly zindex?: number;
};

export class PickerComponent implements Component {
  readonly #query: QueryComponent;
  readonly #select: SelectComponent;
  readonly #preview: PreviewComponent;
  readonly #previewRatio: number;

  constructor(params: Params) {
    const border = getBorder(params.border);
    const divider = getDivider(params.divider);
    this.#query = new QueryComponent({
      ...params,
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
    });
    this.#select = new SelectComponent({
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
      zindex: params.zindex,
    });
    this.#preview = new PreviewComponent({
      mode: params.previewMode,
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
      zindex: params.zindex,
    });
    this.#previewRatio = params.previewRatio;
  }

  get width(): number {
    return this.#query.width + this.#preview.width;
  }

  get height(): number {
    return this.#query.height + this.#preview.height;
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

  async open(denops: Denops): Promise<AsyncDisposable> {
    await using stack = new AsyncDisposableStack();
    stack.use(await this.#preview.open(denops));
    stack.use(await this.#query.open(denops));
    stack.use(await this.#select.open(denops));
    return stack.move();
  }

  async move(denops: Denops, layout: Layout): Promise<void> {
    const { queryLayout, selectLayout, previewLayout } = calcLayout(layout, {
      previewRatio: this.#previewRatio,
    });
    await this.#query.move(denops, queryLayout);
    await this.#select.move(denops, selectLayout);
    if (previewLayout) {
      await this.#preview.move(denops, previewLayout);
    }
  }

  async render(
    denops: Denops,
    { signal }: { signal: AbortSignal },
  ): Promise<void | true> {
    const skipped = [
      await this.#query.render(denops, { signal }),
      await this.#select.render(denops, { signal }),
      await this.#preview.render(denops, { signal }),
    ];
    return skipped.every((v) => v === true) ? true : undefined;
  }

  movePreviewCursor(
    denops: Denops,
    offset: number,
    { signal }: { signal: AbortSignal },
  ): Promise<void> {
    return this.#preview.moveCursor(denops, offset, { signal });
  }

  movePreviewCursorH(
    denops: Denops,
    offset: number,
    { signal }: { signal: AbortSignal },
  ): Promise<void> {
    return this.#preview.moveCursorH(denops, offset, { signal });
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
  readonly previewLayout?: Layout;
} {
  const previewWidth = Math.floor(Math.min(
    width,
    Math.max(0, width * previewRatio),
  ));
  if (previewWidth === 0) {
    return {
      queryLayout: {
        col,
        row,
        width: width - 2, // -2 for border
        height: 1,
      },
      selectLayout: {
        col,
        row: row + 3, // +3 for query and border
        width: width - 2, // -2 for border
        height: height - 1 - 3, // -1 for query, -3 for border
      },
    };
  }
  const mainWidth = width - previewWidth;
  return {
    ...calcLayout({ width: mainWidth, height, col, row }, { previewRatio: 0 }),
    previewLayout: {
      col: col + mainWidth,
      row,
      width: previewWidth - 2, // -2 for border
      height: height - 2, // -2 for border
    },
  };
}
