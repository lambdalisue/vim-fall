import type { Denops } from "https://deno.land/x/denops_std@v6.4.0/mod.ts";
import { g } from "https://deno.land/x/denops_std@v6.4.0/variable/mod.ts";

import { subscribe } from "../util/event.ts";
import { throttle } from "../util/throttle.ts";
import { buildLayout, Layout, LayoutParams } from "./layout/input_layout.ts";
import { InputComponent } from "./component/input.ts";
import { observeInput, startInput } from "./util/input.ts";

export interface InputOptions {
  layout?: Partial<LayoutParams>;
  redraw?: Readonly<{
    throttleWait?: number;
  }>;
  input?: {
    prompt?: string;
    text?: string;
    completion?: string;
    throttleWait?: number;
  };
}

export class Input implements AsyncDisposable {
  #cmdline: string = "";
  #cmdpos: number = 0;

  #options: InputOptions;
  #layout?: Layout;
  #disposable: AsyncDisposableStack;

  constructor(
    options: InputOptions,
  ) {
    const stack = new AsyncDisposableStack();
    this.#cmdline = options.input?.text ?? "";
    this.#options = options;
    this.#disposable = stack;
  }

  async open(denops: Denops): Promise<AsyncDisposable> {
    if (this.#layout) {
      throw new Error("The picker is already opened");
    }
    this.#layout = await buildLayout(denops, {
      title: this.#options.layout?.title,
      width: this.#options.layout?.width,
      widthRatio: this.#options.layout?.widthRatio ?? WIDTH_RATION,
      widthMin: this.#options.layout?.widthMin ?? WIDTH_MIN,
      widthMax: this.#options.layout?.widthMax ?? WIDTH_MAX,
      border: this.#options.layout?.border,
      zindex: this.#options.layout?.zindex ?? 52,
    });
    this.#disposable.use(this.#layout);
    return {
      [Symbol.asyncDispose]: async () => {
        if (this.#layout) {
          await this.#layout[Symbol.asyncDispose]();
          this.#layout = undefined;
        }
      },
    };
  }

  async start(
    denops: Denops,
    options: { signal: AbortSignal },
  ): Promise<string | null> {
    if (!this.#layout) {
      throw new Error("The picker is not opened");
    }

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

    // Set internal variables
    await g.set(
      denops,
      "_fall_layout_input_winid",
      this.#layout.input.winid,
    );

    // Bind components to the layout
    const input = new InputComponent(
      this.#layout.input.bufnr,
      this.#layout.input.winid,
      {
        prompt: this.#options.input?.prompt,
      },
    );

    const redraw = throttle(() => {
      denops.cmd("redraw").catch((err) => {
        const m = err.message ?? err;
        console.debug(`Failed to execute 'redraw': ${m}`);
      });
    }, this.#options.redraw?.throttleWait ?? REDRAW_THROTTLE_WAIT);
    const updateInputComponent = throttle(() => {
      input.render(
        denops,
        this.#cmdline,
        this.#cmdpos,
        { signal },
      ).then(() => redraw());
    }, this.#options.input?.throttleWait ?? INPUT_THROTTLE_WAIT);

    // Subscribe custom events
    stack.use(subscribe("cmdline-changed", (cmdline) => {
      this.#cmdline = cmdline;
      updateInputComponent();
    }));
    stack.use(subscribe("cmdpos-changed", (cmdpos) => {
      this.#cmdpos = cmdpos;
      updateInputComponent();
    }));

    // Observe Vim's prompt
    stack.use(observeInput(denops, { signal }));

    // Wait for user input
    if (
      await startInput(denops, {
        text: this.#cmdline,
        completion: this.#options.input?.completion,
      }, { signal })
    ) {
      return null;
    }
    return this.#cmdline;
  }

  async [Symbol.asyncDispose](): Promise<void> {
    await this.#disposable.disposeAsync();
  }
}

const WIDTH_RATION = 0.3;
const WIDTH_MIN = 10;
const WIDTH_MAX = 80;
const REDRAW_THROTTLE_WAIT = 30;
const INPUT_THROTTLE_WAIT = 20;
