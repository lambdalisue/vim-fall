import type { Denops } from "https://deno.land/x/denops_std@v6.4.0/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v6.4.0/function/mod.ts";
import * as buffer from "https://deno.land/x/denops_std@v6.4.0/buffer/mod.ts";

import { Spinner } from "../util/spinner.ts";
import { getByteLength } from "../../util/text.ts";

type Context = {
  readonly cmdline: string;
  readonly cmdpos: number;
  readonly collecting: boolean | "failed";
  readonly processing: boolean | "failed";
  readonly counter: {
    readonly processed: number;
    readonly collected: number;
    readonly truncated: boolean;
  };
};

type Params = {
  readonly spinner?: readonly string[];
  readonly headSymbol?: string;
  readonly failSymbol?: string;
};

export class QueryComponent implements Disposable {
  readonly #bufnr: number;
  readonly #winid: number;
  readonly #spinner: Spinner;
  readonly #headSymbol: string;
  readonly #failSymbol: string;

  constructor(bufnr: number, winid: number, params: Params) {
    this.#bufnr = bufnr;
    this.#winid = winid;
    this.#spinner = new Spinner(params.spinner);
    this.#headSymbol = params.headSymbol ?? HEAD_SYMBOL;
    this.#failSymbol = params.failSymbol ?? FAIL_SYMBOL;
  }

  async render(
    denops: Denops,
    { cmdline, cmdpos, collecting, processing, counter }: Context,
    { signal }: { signal: AbortSignal },
  ): Promise<void> {
    try {
      const winwidth = await fn.winwidth(denops, this.#winid);
      signal.throwIfAborted();

      const spinner = this.#spinner.next();
      const headSymbol = !processing
        ? this.#headSymbol
        : processing === "failed"
        ? this.#failSymbol
        : spinner;
      const tailSymbol = !collecting
        ? ""
        : collecting === "failed"
        ? this.#failSymbol
        : spinner;
      const collected = counter.truncated
        ? `${counter.collected}+`
        : `${counter.collected}`;

      // TODO: Fix `cmdline` overflow
      const prefix = `${headSymbol} `;
      const suffix = ` ${counter.processed}/${collected} ${tailSymbol}`;
      const spacer = " ".repeat(
        Math.max(
          0,
          winwidth - Array.from(prefix + cmdline + suffix).length,
        ),
      );
      const prefixByteLength = getByteLength(prefix);
      const middleByteLength = getByteLength(cmdline + spacer);
      const suffixByteLength = getByteLength(suffix);

      await buffer.replace(denops, this.#bufnr, [
        prefix + cmdline + spacer + suffix,
      ]);
      signal.throwIfAborted();

      await buffer.decorate(denops, this.#bufnr, [
        {
          line: 1,
          column: 1,
          length: prefixByteLength,
          highlight: "FallQueryHeader",
        },
        {
          line: 1,
          column: Math.max(1, prefixByteLength + cmdpos),
          length: 1,
          highlight: "FallQueryCursor",
        },
        {
          line: 1,
          column: 1 + prefixByteLength + middleByteLength,
          length: suffixByteLength,
          highlight: "FallQueryCounter",
        },
      ]);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      const m = err.message ?? err;
      console.warn(`[fall] Failed to render the query component: ${m}`);
    }
  }

  [Symbol.dispose]() {
    this.#spinner[Symbol.dispose]();
  }
}

const HEAD_SYMBOL = ">";
const FAIL_SYMBOL = "☓";
