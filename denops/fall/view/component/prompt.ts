import type { Denops } from "https://deno.land/x/denops_std@v6.3.0/mod.ts";
import * as buffer from "https://deno.land/x/denops_std@v6.3.0/buffer/mod.ts";

import { Spinner } from "../util/spinner.ts";

const DEFAULT_HEAD_SYMBOL = ">";
const DEFAULT_FAIL_SYMBOL = "☓";

export interface PromptComponentParams {
  winwidth: number;
  spinner?: string[];
  headSymbol?: string;
  failSymbol?: string;
}

export interface PromptComponentCounter {
  collected: number;
  processed: number;
}

/**
 * A component that renders a prompt buffer.
 */
export class PromptComponent {
  #bufnr: number;
  #winwidth: number;
  #spinner: Spinner;
  #headSymbol: string;
  #failSymbol: string;

  #changed: boolean = false;
  #cmdline: string = "";
  #cmdpos: number = 0;
  #collecting: boolean | "failed" = false;
  #processing: boolean | "failed" = false;
  #counter: PromptComponentCounter | undefined;

  constructor(bufnr: number, _winid: number, params: PromptComponentParams) {
    this.#bufnr = bufnr;
    this.#winwidth = params.winwidth;
    this.#spinner = new Spinner(params.spinner);
    this.#headSymbol = params.headSymbol ?? DEFAULT_HEAD_SYMBOL;
    this.#failSymbol = params.failSymbol ?? DEFAULT_FAIL_SYMBOL;
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
   * Set the collecting state.
   */
  set collecting(value: boolean | "failed") {
    this.#changed = this.#changed || value === true;
    this.#collecting = value;
  }

  /**
   * Set the processing state.
   */
  set processing(value: boolean | "failed") {
    this.#changed = this.#changed || value === true;
    this.#processing = value;
  }

  /**
   * Set the counter to be rendered.
   */
  set counter(value: PromptComponentCounter) {
    const changed = this.#counter !== value;
    this.#changed = this.#changed || changed;
    this.#counter = value;
  }

  /**
   * Render the prompt buffer.
   *
   * It returns true if the prompt buffer is rendered.
   */
  async render(
    denops: Denops,
    { signal }: { signal: AbortSignal },
  ): Promise<boolean> {
    if (!this.#changed) return false;
    this.#changed = this.#processing === true || this.#collecting === true;

    const spinner = this.#spinner.next();
    const prefix = this.#processing === "failed"
      ? `${this.#failSymbol} `
      : this.#processing
      ? `${spinner} `
      : `${this.#headSymbol} `;
    const suffix = this.#collecting === "failed"
      ? ` ${this.#failSymbol}`
      : this.#collecting
      ? ` ${spinner}`
      : "";
    const counter = this.#counter
      ? `${this.#counter.processed}/${this.#counter.collected}`
      : "";
    const prefixByteLength = getByteLength(prefix);
    const suffixByteLength = getByteLength(suffix);
    const counterByteLength = getByteLength(counter);
    const cmdlineByteLength = getByteLength(this.#cmdline);
    const head = prefix + this.#cmdline;
    const tail = counter + suffix;
    const spacer = " ".repeat(
      this.#winwidth - [head, tail].join("").length,
    );

    // Render UI
    try {
      await buffer.replace(denops, this.#bufnr, [head + spacer + tail]);
      if (signal.aborted) return true;

      await buffer.decorate(denops, this.#bufnr, [
        {
          line: 1,
          column: 1,
          length: prefixByteLength,
          highlight: "FallPromptHeader",
        },
        {
          line: 1,
          column: Math.max(1, prefixByteLength + this.#cmdpos),
          length: 1,
          highlight: "FallPromptCursor",
        },
        {
          line: 1,
          column: prefixByteLength + cmdlineByteLength + spacer.length + 1,
          length: counterByteLength + suffixByteLength,
          highlight: "FallPromptCounter",
        },
      ]);
    } catch (err) {
      // Fail silently
      console.debug(
        `[fall] Failed to render content to the prompt buffer: ${err}`,
      );
    }
    return true;
  }
}

function getByteLength(str: string): number {
  return new TextEncoder().encode(str).length;
}
