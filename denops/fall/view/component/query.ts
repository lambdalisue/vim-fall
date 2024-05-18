import type { Denops } from "https://deno.land/x/denops_std@v6.4.0/mod.ts";
import * as buffer from "https://deno.land/x/denops_std@v6.4.0/buffer/mod.ts";

import { Spinner } from "../util/spinner.ts";
import { getByteLength } from "../../util/text.ts";

const DEFAULT_HEAD_SYMBOL = ">";
const DEFAULT_FAIL_SYMBOL = "☓";

export type QueryComponentParams = Readonly<{
  winwidth: number;
  spinner?: readonly string[];
  headSymbol?: string;
  failSymbol?: string;
}>;

export type QueryComponentCounter = Readonly<{
  collected: number;
  processed: number;
}>;

/**
 * A component that renders a query buffer.
 */
export class QueryComponent {
  #bufnr: number;
  #winwidth: number;
  #spinner: Spinner;
  #headSymbol: string;
  #failSymbol: string;

  collecting: boolean | "failed" = false;
  processing: boolean | "failed" = false;
  counter: QueryComponentCounter | undefined;

  constructor(bufnr: number, _winid: number, params: QueryComponentParams) {
    this.#bufnr = bufnr;
    this.#winwidth = params.winwidth;
    this.#spinner = new Spinner(params.spinner);
    this.#headSymbol = params.headSymbol ?? DEFAULT_HEAD_SYMBOL;
    this.#failSymbol = params.failSymbol ?? DEFAULT_FAIL_SYMBOL;
  }

  /**
   * Render the query buffer.
   *
   * It returns true if the query buffer is rendered.
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
        `[fall] Failed to render the query component: ${m}`,
      );
    }
  }

  async #render(
    denops: Denops,
    cmdline: string,
    cmdpos: number,
    { signal }: { signal: AbortSignal },
  ): Promise<void> {
    const spinner = this.#spinner.next();
    const prefix = this.processing === "failed"
      ? `${this.#failSymbol} `
      : this.processing
      ? `${spinner} `
      : `${this.#headSymbol} `;
    const suffix = this.collecting === "failed"
      ? ` ${this.#failSymbol}`
      : this.collecting
      ? ` ${spinner}`
      : "";
    const counter = this.counter
      ? `${this.counter.processed}/${this.counter.collected}`
      : "";
    // TODO: Support query text longer than the query winwidth.
    const prefixByteLength = getByteLength(prefix);
    const suffixByteLength = getByteLength(suffix);
    const counterByteLength = getByteLength(counter);
    const cmdlineByteLength = getByteLength(cmdline);
    const head = prefix + cmdline;
    const tail = counter + suffix;
    const spacer = " ".repeat(
      Math.max(0, this.#winwidth - [head, tail].join("").length),
    );

    // Render UI
    await buffer.replace(denops, this.#bufnr, [head + spacer + tail]);
    signal.throwIfAborted();

    await buffer.decorate(denops, this.#bufnr, [
      {
        line: 1,
        column: 1,
        length: prefixByteLength,
        highlight: "FallPromptHeader",
      },
      {
        line: 1,
        column: Math.max(1, prefixByteLength + cmdpos),
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
  }
}
