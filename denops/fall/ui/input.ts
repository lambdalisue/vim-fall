import type { Denops } from "https://deno.land/x/denops_std@v6.4.0/mod.ts";
import * as opt from "https://deno.land/x/denops_std@v6.4.0/option/mod.ts";
import { collect } from "https://deno.land/x/denops_std@v6.4.0/batch/mod.ts";

import { subscribe } from "../util/event.ts";
import { startAsyncScheduler } from "../util/async_scheduler.ts";
import { observeInput, startInput } from "./util/input.ts";
import { type Border } from "./util/border.ts";
import { type Layout } from "./component/base.ts";
import { InputComponent } from "./component/input.ts";

export type Options = {
  readonly title?: string;
  readonly style?: {
    readonly widthMin?: number;
    readonly widthMax?: number;
    readonly widthRatio?: number;
    readonly border?: Border;
    readonly zindex?: number;
  };
  readonly redraw?: {
    readonly interval?: number;
  };
  readonly input?: {
    readonly prompt?: string;
    readonly text?: string;
    readonly completion?: string;
  };
};

export class Input {
  readonly #options: Options;

  #input: InputComponent;

  constructor(options: Options) {
    this.#options = options;
    this.#input = new InputComponent({
      prompt: options.input?.prompt,
      title: options.title ?? "",
      border: options.style?.border ?? "single",
      zindex: options.style?.zindex,
    });
  }

  async #calcLayout(denops: Denops): Promise<Layout> {
    const [screenWidth, screenHeight] = await collect(
      denops,
      (denops) => [
        opt.columns.get(denops),
        opt.lines.get(denops),
      ],
    );
    const width = calc(
      screenWidth,
      this.#options.style?.widthRatio ?? WIDTH_RATIO,
      this.#options.style?.widthMin ?? WIDTH_MIN,
      this.#options.style?.widthMax ?? WIDTH_MAX,
    );
    const height = 1;
    const col = Math.floor((screenWidth - width) / 2);
    const row = Math.floor((screenHeight - height) / 2);
    return { width, height, col, row };
  }

  async open(denops: Denops): Promise<AsyncDisposable> {
    const layout = await this.#calcLayout(denops);
    await this.#input.move(denops, layout);
    return this.#input.open(denops);
  }

  async start(
    denops: Denops,
    options: { signal: AbortSignal },
  ): Promise<string | null> {
    await using stack = new AsyncDisposableStack();
    const controller = new AbortController();
    const signal = AbortSignal.any([options.signal, controller.signal]);
    stack.defer(() => {
      try {
        controller.abort();
      } catch {
        // Fail silently
      }
    });

    // Subscribe custom events
    stack.use(subscribe("vim-resized", () => {
      this.#calcLayout(denops).then(async (layout) => {
        await this.#input.move(denops, layout);
        await denops.cmd("redraw");
      });
    }));
    stack.use(subscribe("cmdline-changed", (cmdline) => {
      this.#input.cmdline = cmdline;
    }));
    stack.use(subscribe("cmdpos-changed", (cmdpos) => {
      this.#input.cmdpos = cmdpos;
    }));

    startAsyncScheduler(
      async () => {
        await this.#input.render(denops, { signal });
        await denops.cmd("redraw");
      },
      this.#options.redraw?.interval ?? REDRAW_INTERVAL,
      { signal },
    );
    // Observe Vim's prompt
    stack.use(observeInput(denops, { signal }));

    // Wait for user input
    if (
      await startInput(denops, {
        text: this.#options.input?.text,
        completion: this.#options.input?.completion,
      }, { signal })
    ) {
      return null;
    }
    return this.#input.cmdline;
  }
}

function calc(value: number, ratio: number, min: number, max: number): number {
  return Math.floor(Math.max(min, Math.min(max, value * ratio)));
}

const WIDTH_RATIO = 0.3;
const WIDTH_MIN = 10;
const WIDTH_MAX = 80;
const REDRAW_INTERVAL = 0;
