import type { Denops } from "jsr:@denops/std@7.0.0";
import * as buffer from "jsr:@denops/std@7.0.0/buffer";

import { getByteLength } from "../../util/text.ts";
import { BaseComponent, type Params as BaseParams } from "./base.ts";

type Params = BaseParams & {
  readonly prompt?: string;
};

export class InputComponent extends BaseComponent {
  protected readonly name = "input";
  readonly #prompt: string;
  readonly #promptByteLength: number;

  #modified = false;
  #cmdline: string = "";
  #cmdpos: number = 0;

  constructor(params: Params) {
    super(params);
    this.#prompt = params.prompt ?? "";
    this.#promptByteLength = getByteLength(this.#prompt);
  }

  get cmdline(): string {
    return this.#cmdline;
  }

  set cmdline(value: string) {
    if (this.#cmdline === value) return;
    this.#cmdline = value;
    this.#modified = true;
  }

  get cmdpos(): number {
    return this.#cmdpos;
  }

  set cmdpos(value: number) {
    if (this.#cmdpos === value) return;
    this.#cmdpos = value;
    this.#modified = true;
  }

  async render(
    denops: Denops,
    { signal }: { signal: AbortSignal },
  ): Promise<void | true> {
    if (!this.window) {
      return true;
    }
    const { bufnr } = this.window;
    if (!this.#modified) {
      return true;
    }
    this.#modified = false;
    try {
      await buffer.replace(denops, bufnr, [
        this.#prompt + this.#cmdline,
      ]);
      signal.throwIfAborted();

      await buffer.decorate(denops, bufnr, [
        {
          line: 1,
          column: 1,
          length: this.#promptByteLength,
          highlight: "FallInputHeader",
        },
        {
          line: 1,
          column: Math.max(1, this.#promptByteLength + this.#cmdpos),
          length: 1,
          highlight: "FallInputCursor",
        },
      ]);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      const m = err.message ?? err;
      console.warn(
        `[fall] Failed to render the input component: ${m}`,
      );
    }
  }
}
