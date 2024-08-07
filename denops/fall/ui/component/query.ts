import type { Denops } from "jsr:@denops/std@^7.0.0";
import { equal } from "jsr:@std/assert/equal";
import * as fn from "jsr:@denops/std@^7.0.0/function";
import * as buffer from "jsr:@denops/std@^7.0.0/buffer";

import { getByteLength } from "../../util/text.ts";
import { Spinner } from "../util/spinner.ts";
import { BaseComponent, type Params as BaseParams } from "./base.ts";

export type Counter = {
  readonly projected: number;
  readonly collected: number;
  readonly truncated: boolean;
};

export type Params = BaseParams & {
  readonly spinner?: readonly string[];
  readonly headSymbol?: string;
  readonly failSymbol?: string;
};

export class QueryComponent extends BaseComponent implements Disposable {
  protected readonly name = "query";

  readonly #spinner: Spinner;
  readonly #headSymbol: string;
  readonly #failSymbol: string;

  #modified = true;
  #cmdline: string = "";
  #cmdpos: number = 0;
  #counter: Counter = {
    collected: 0,
    projected: 0,
    truncated: false,
  };
  #collecting: boolean | "failed" = false;
  #processing: boolean | "failed" = false;

  constructor(options: Params) {
    super(options);
    this.#spinner = new Spinner(options.spinner);
    this.#headSymbol = options.headSymbol ?? HEAD_SYMBOL;
    this.#failSymbol = options.failSymbol ?? FAIL_SYMBOL;
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

  get collecting(): boolean | "failed" {
    return this.#collecting;
  }

  set collecting(value: boolean | "failed") {
    this.#collecting = value;
  }

  get processing(): boolean | "failed" {
    return this.#processing;
  }

  set processing(value: boolean | "failed") {
    this.#processing = value;
  }

  get counter(): Counter {
    return this.#counter;
  }

  set counter(value: Counter) {
    if (equal(this.#counter, value)) return;
    this.#counter = value;
    this.#modified = true;
  }

  async render(
    denops: Denops,
    { signal }: { signal: AbortSignal },
  ): Promise<void | true> {
    if (!this.window) {
      return true;
    }
    const { winid, bufnr } = this.window;
    if (!this.#modified && !this.#collecting && !this.#processing) {
      return true;
    }
    this.#modified = false;
    try {
      const winwidth = await fn.winwidth(denops, winid);
      signal.throwIfAborted();

      const spinner = this.#spinner.next();
      const headSymbol = !this.#processing
        ? this.#headSymbol
        : this.#processing === "failed"
        ? this.#failSymbol
        : spinner;
      const tailSymbol = !this.#collecting
        ? ""
        : this.#collecting === "failed"
        ? this.#failSymbol
        : spinner;
      const collected = this.#counter.truncated
        ? `${this.#counter.collected}+`
        : `${this.#counter.collected}`;

      // TODO: Fix `cmdline` overflow
      const prefix = `${headSymbol} `;
      const suffix = ` ${this.#counter.projected}/${collected} ${tailSymbol}`;
      const spacer = " ".repeat(
        Math.max(
          0,
          winwidth - Array.from(prefix + this.#cmdline + suffix).length,
        ),
      );
      const prefixByteLength = getByteLength(prefix);
      const middleByteLength = getByteLength(this.#cmdline + spacer);
      const suffixByteLength = getByteLength(suffix);

      await buffer.replace(denops, bufnr, [
        prefix + this.#cmdline + spacer + suffix,
      ]);
      signal.throwIfAborted();

      await buffer.decorate(denops, bufnr, [
        {
          line: 1,
          column: 1,
          length: prefixByteLength,
          highlight: "FallQueryHeader",
        },
        {
          line: 1,
          column: Math.max(1, prefixByteLength + this.#cmdpos),
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
      console.warn(`[fall] Failed to render the query window: ${m}`);
    }
  }

  [Symbol.dispose]() {
    this.#spinner[Symbol.dispose]();
  }
}

const HEAD_SYMBOL = ">";
const FAIL_SYMBOL = "☓";
