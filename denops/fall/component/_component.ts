import type { Denops } from "jsr:@denops/std@^7.3.0";
import * as popup from "jsr:@denops/std@^7.3.0/popup";

import type { Border } from "../../@fall/theme.ts";
import type { Dimension } from "../../@fall/layout.ts";

export type ComponentProperties = {
  title?: string;
  border?: Border;
  zindex?: number;
};

export type ComponentParams = ComponentProperties & {
  dimension: Readonly<Dimension>;
};

export type ComponentInfo = {
  bufnr: number;
  winid: number;
};

export type Component = AsyncDisposable & {
  open(
    denops: Denops,
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
export abstract class BaseComponent implements Component {
  #window?: popup.PopupWindow;
  #dimension: Readonly<Dimension>;
  protected properties: Readonly<ComponentProperties>;

  constructor({ dimension, ...properties }: Readonly<ComponentParams>) {
    this.#dimension = dimension;
    this.properties = properties;
  }

  get info(): Readonly<ComponentInfo> | undefined {
    if (!this.#window) {
      return undefined;
    }
    const { bufnr, winid } = this.#window;
    return { bufnr, winid };
  }

  get dimension(): Readonly<Dimension> {
    return this.#dimension;
  }

  async open(
    denops: Denops,
    { signal }: { signal?: AbortSignal } = {},
  ): Promise<AsyncDisposable> {
    if (this.#window) {
      return this;
    }
    signal?.throwIfAborted();
    this.#window = await popup.open(denops, {
      ...this.#dimension,
      ...this.properties,
      relative: "editor",
      anchor: "NW",
      highlight: {
        normal: "FallNormal",
        border: "FallBorder",
      },
      noRedraw: true,
    });
    return this;
  }

  async close(): Promise<void> {
    await this.#window?.close();
    this.#window = undefined;
  }

  async move(
    denops: Denops,
    dimension: Readonly<Partial<Dimension>>,
    { signal }: { signal?: AbortSignal } = {},
  ): Promise<void> {
    this.#dimension = {
      ...this.#dimension,
      ...dimension,
    };
    if (this.#window) {
      signal?.throwIfAborted();
      await popup.config(denops, this.#window.winid, {
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
    if (this.#window) {
      signal?.throwIfAborted();
      await popup.config(denops, this.#window.winid, {
        ...properties,
        noRedraw: true,
      });
    }
  }

  abstract render(
    _denops: Denops,
    _option?: { signal?: AbortSignal },
  ): Promise<true | void>;

  async [Symbol.asyncDispose]() {
    await this.close();
  }
}
