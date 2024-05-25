import type { Denops } from "https://deno.land/x/denops_std@v6.4.0/mod.ts";
import * as buffer from "https://deno.land/x/denops_std@v6.4.0/buffer/mod.ts";

import { getByteLength } from "../../util/text.ts";

export type Context = {
  readonly cmdline: string;
  readonly cmdpos: number;
};

export type Params = {
  readonly prompt?: string;
};

export class InputComponent implements Disposable {
  readonly #bufnr: number;
  readonly #prompt: string;
  readonly #promptByteLength: number;

  constructor(bufnr: number, _winid: number, params: Params) {
    this.#bufnr = bufnr;
    this.#prompt = params.prompt ?? "";
    this.#promptByteLength = getByteLength(this.#prompt);
  }

  async render(
    denops: Denops,
    { cmdline, cmdpos }: Context,
    { signal }: { signal: AbortSignal },
  ): Promise<void> {
    try {
      await buffer.replace(denops, this.#bufnr, [this.#prompt + cmdline]);
      signal.throwIfAborted();

      await buffer.decorate(denops, this.#bufnr, [
        {
          line: 1,
          column: 1,
          length: this.#promptByteLength,
          highlight: "FallInputHeader",
        },
        {
          line: 1,
          column: Math.max(1, this.#promptByteLength + cmdpos),
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

  [Symbol.dispose]() {
    // Do nothing
  }
}
