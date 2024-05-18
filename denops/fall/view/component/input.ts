import type { Denops } from "https://deno.land/x/denops_std@v6.4.0/mod.ts";
import * as buffer from "https://deno.land/x/denops_std@v6.4.0/buffer/mod.ts";

import { getByteLength } from "../../util/text.ts";

export interface InputComponentParams {
  prompt?: string;
}

/**
 * A component that renders a input buffer.
 */
export class InputComponent {
  #bufnr: number;
  #prompt: string;
  #promptByteLength: number;

  constructor(bufnr: number, _winid: number, params: InputComponentParams) {
    this.#bufnr = bufnr;
    this.#prompt = params.prompt ?? "";
    this.#promptByteLength = getByteLength(this.#prompt);
  }

  /**
   * Render the input buffer.
   *
   * It returns true if the input buffer is rendered.
   */
  async render(
    denops: Denops,
    cmdline: string,
    cmdpos: number,
    options: { signal: AbortSignal },
  ): Promise<void> {
    try {
      await this.#render(denops, cmdline, cmdpos, options);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      const m = err.message ?? err;
      console.warn(
        `[fall] Failed to render the input component: ${m}`,
      );
    }
  }

  async #render(
    denops: Denops,
    cmdline: string,
    cmdpos: number,
    { signal }: { signal: AbortSignal },
  ): Promise<void> {
    await buffer.replace(denops, this.#bufnr, [this.#prompt + cmdline]);
    signal.throwIfAborted();

    await buffer.decorate(denops, this.#bufnr, [
      {
        line: 1,
        column: 1,
        length: this.#promptByteLength,
        highlight: "FallPromptHeader",
      },
      {
        line: 1,
        column: Math.max(1, this.#promptByteLength + cmdpos),
        length: 1,
        highlight: "FallPromptCursor",
      },
    ]);
  }
}
