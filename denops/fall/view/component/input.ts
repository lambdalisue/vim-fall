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

  #changed: boolean = false;
  #cmdline: string = "";
  #cmdpos: number = 0;

  constructor(bufnr: number, _winid: number, params: InputComponentParams) {
    this.#bufnr = bufnr;
    this.#prompt = params.prompt ?? "";
  }

  /**
   * Set the command line to be rendered.
   */
  set cmdline(value: string) {
    const changed = this.#cmdline !== value;
    this.#changed = this.#changed || changed;
    this.#cmdline = value;
  }

  /**
   * Set the position of the cursor in the command line.
   */
  set cmdpos(value: number) {
    const changed = this.#cmdpos !== value;
    this.#changed = this.#changed || changed;
    this.#cmdpos = value;
  }

  /**
   * Render the input buffer.
   *
   * It returns true if the input buffer is rendered.
   */
  async render(
    denops: Denops,
    { signal }: { signal: AbortSignal },
  ): Promise<boolean> {
    if (!this.#changed) return false;

    const promptByteLength = getByteLength(this.#prompt);

    // Render UI
    try {
      await buffer.replace(denops, this.#bufnr, [this.#prompt + this.#cmdline]);
      if (signal.aborted) return true;

      await buffer.decorate(denops, this.#bufnr, [
        {
          line: 1,
          column: 1,
          length: promptByteLength,
          highlight: "FallPromptHeader",
        },
        {
          line: 1,
          column: Math.max(1, promptByteLength + this.#cmdpos),
          length: 1,
          highlight: "FallPromptCursor",
        },
      ]);
    } catch (err) {
      // Fail silently
      console.debug(
        `[fall] Failed to render content to the input buffer: ${err}`,
      );
    }
    return true;
  }
}
