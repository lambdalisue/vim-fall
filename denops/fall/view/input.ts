import type { Denops } from "https://deno.land/x/denops_std@v6.4.0/mod.ts";
import { g } from "https://deno.land/x/denops_std@v6.4.0/variable/mod.ts";
import { is, type Predicate } from "jsr:@core/unknownutil@3.18.0";

import { startAsyncScheduler } from "../util/async_scheduler.ts";
import { subscribe } from "../util/event.ts";
import {
  buildLayout,
  isLayoutParams,
  Layout,
  LayoutParams,
} from "./layout/input_layout.ts";
import { InputComponent } from "./component/input.ts";
import { observeInput, startInput } from "./util/input.ts";

export interface InputOptions {
  layout?: Partial<LayoutParams>;
  input?: {
    prompt?: string;
    text?: string;
    completion?: string;
  };
  updateInterval?: number;
}

export const isInputOptions = is.PartialOf(is.ObjectOf({
  layout: is.PartialOf(isLayoutParams),
  input: is.PartialOf(is.ObjectOf({
    prompt: is.String,
    text: is.String,
    completion: is.String,
  })),
  updateInterval: is.Number,
})) satisfies Predicate<InputOptions>;

export class Input implements AsyncDisposable {
  #text: string;

  #options: InputOptions;
  #layout: Layout;
  #disposable: AsyncDisposableStack;

  private constructor(
    options: InputOptions,
    layout: Layout,
    disposable: AsyncDisposableStack,
  ) {
    this.#text = options.input?.text ?? "";
    this.#options = options;
    this.#layout = layout;
    this.#disposable = disposable;
  }

  static async create(
    denops: Denops,
    options: InputOptions,
  ): Promise<Input> {
    const stack = new AsyncDisposableStack();

    // Build layout
    const layout = stack.use(
      await buildLayout(denops, {
        title: options.layout?.title,
        width: options.layout?.width,
        widthRatio: options.layout?.widthRatio ?? WIDTH_RATION,
        widthMin: options.layout?.widthMin ?? WIDTH_MIN,
        widthMax: options.layout?.widthMax ?? WIDTH_MAX,
        border: options.layout?.border,
        zindex: options.layout?.zindex ?? 52,
      }),
    );

    return new Input(
      options,
      layout,
      stack.move(),
    );
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

    // Subscribe custom events
    stack.use(subscribe("cmdline-changed", (cmdline) => {
      this.#text = cmdline;
      input.cmdline = this.#text;
    }));
    stack.use(subscribe("cmdpos-changed", (cmdpos) => {
      input.cmdpos = cmdpos;
    }));

    // Update UI in background
    stack.use(startAsyncScheduler(
      async () => {
        const isUpdated = await input.render(denops, { signal });
        if (isUpdated) {
          await denops.cmd(`redraw`);
        }
      },
      this.#options.updateInterval ?? UPDATE_INTERVAL,
      { signal },
    ));

    // Observe Vim's prompt
    stack.use(observeInput(denops, { signal }));

    // Wait for user input
    if (
      await startInput(denops, {
        text: this.#text,
        completion: this.#options.input?.completion,
      }, { signal })
    ) {
      return null;
    }
    return this.#text;
  }

  async [Symbol.asyncDispose](): Promise<void> {
    await this.#disposable.disposeAsync();
  }
}

const WIDTH_RATION = 0.3;
const WIDTH_MIN = 10;
const WIDTH_MAX = 80;
const UPDATE_INTERVAL = 20;
