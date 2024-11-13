import type { Denops } from "jsr:@denops/std@^7.3.2";
import * as popup from "jsr:@denops/std@^7.3.2/popup";
import type { Border } from "jsr:@vim-fall/std@^0.4.0/theme";
import type { Dimension } from "jsr:@vim-fall/std@^0.4.0/coordinator";

export type ComponentProperties = {
  title?: string;
  border?: Border;
  zindex?: number;
};

export type ComponentInfo = {
  bufnr: number;
  winid: number;
  dimension: Readonly<Dimension>;
};

export type Component = AsyncDisposable & {
  open(
    denops: Denops,
    dimension: Readonly<Partial<Dimension>>,
    option?: { signal?: AbortSignal },
  ): Promise<AsyncDisposable>;

  move(
    denops: Denops,
    dimension: Readonly<Partial<Dimension>>,
    options?: { signal?: AbortSignal },
  ): Promise<void>;

  update(
    denops: Denops,
    properties: Readonly<ComponentProperties>,
    options?: { signal?: AbortSignal },
  ): Promise<void>;

  render(
    denops: Denops,
    options?: { signal?: AbortSignal },
  ): Promise<true | void>;

  close(): Promise<void>;
};

/**
 * ```
 *                 width
 *  ┌───────────────────────────────────┐
 * ╭─────────────────────────────────────╮
 * │                                     │ ┐
 * │                                     │ │
 * │                                     │ │height
 * │                                     │ │
 * │                                     │ ┘
 * ╰─────────────────────────────────────╯
 * ```
 */
export class BaseComponent implements Component {
  #opened?: {
    readonly window: popup.PopupWindow;
    readonly dimension: Readonly<Dimension>;
  };
  protected properties: Readonly<ComponentProperties>;

  constructor(properties: Readonly<ComponentProperties> = {}) {
    this.properties = properties;
  }

  get info(): Readonly<ComponentInfo> | undefined {
    if (!this.#opened) {
      return undefined;
    }
    const { bufnr, winid } = this.#opened.window;
    return { bufnr, winid, dimension: this.#opened.dimension };
  }

  async open(
    denops: Denops,
    dimension: Readonly<Dimension>,
    { signal }: { signal?: AbortSignal } = {},
  ): Promise<AsyncDisposable> {
    if (this.#opened) {
      return this;
    }
    signal?.throwIfAborted();
    this.#opened = {
      window: await popup.open(denops, {
        ...dimension,
        ...this.properties,
        relative: "editor",
        anchor: "NW",
        highlight: {
          normal: "FallNormal",
          border: "FallBorder",
        },
        noRedraw: true,
      }),
      dimension,
    };
    return this;
  }

  async move(
    denops: Denops,
    dimension: Readonly<Partial<Dimension>>,
    { signal }: { signal?: AbortSignal } = {},
  ): Promise<void> {
    if (this.#opened) {
      this.#opened = {
        ...this.#opened,
        dimension: {
          ...this.#opened.dimension,
          ...dimension,
        },
      };
      signal?.throwIfAborted();
      await popup.config(denops, this.#opened.window.winid, {
        ...dimension,
        relative: "editor",
        noRedraw: true,
      });
    }
  }

  async update(
    denops: Denops,
    properties: Readonly<ComponentProperties>,
    { signal }: { signal?: AbortSignal } = {},
  ): Promise<void> {
    this.properties = {
      ...this.properties,
      ...properties,
    };
    if (this.#opened) {
      signal?.throwIfAborted();
      await popup.config(denops, this.#opened.window.winid, {
        ...properties,
        noRedraw: true,
      });
    }
  }

  render(
    _denops: Denops,
    _option?: { signal?: AbortSignal },
  ): Promise<true | void> {
    return Promise.resolve(true);
  }

  async close(): Promise<void> {
    await this.#opened?.window.close();
    this.#opened = undefined;
  }

  async [Symbol.asyncDispose]() {
    await this.close();
  }
}
