import type { Denops } from "jsr:@denops/std@^7.3.0";
import { unreachable } from "jsr:@core/errorutil@^1.2.0/unreachable";

import type { IdItem } from "../@fall/item.ts";
import type { Dimension, Layout, Size } from "../@fall/layout.ts";
import type { Source } from "../@fall/source.ts";
import type { Matcher } from "../@fall/matcher.ts";
import type { Sorter } from "../@fall/sorter.ts";
import type { Renderer } from "../@fall/renderer.ts";
import type { Previewer } from "../@fall/previewer.ts";
import type { Border, Theme } from "../@fall/theme.ts";
import { Scheduler } from "./lib/scheduler.ts";
import { Cmdliner } from "./util/cmdliner.ts";
import { emitPickerEnter, emitPickerLeave } from "./util/emitter.ts";
import { CollectProcessor } from "./processor/collect.ts";
import { MatchProcessor } from "./processor/match.ts";
import { VisualizeProcessor } from "./processor/visualize.ts";
import { PreviewProcessor } from "./processor/preview.ts";
import { InputComponent } from "./component/input.ts";
import { ListComponent } from "./component/list.ts";
import { PreviewComponent } from "./component/preview.ts";
import { consume, type Event } from "./event.ts";

const SCHEDULER_INTERVAL = 10;

export type PickerParams<T> = {
  name: string;
  screen: Size;
  theme: Theme;
  layout: Layout;
  source: Source<T>;
  matcher: Matcher<T>;
  sorter?: Sorter<T>;
  renderer?: Renderer<T>;
  previewer?: Previewer<T>;
  zindex?: number;
};

export type PickerResult<T> = {
  readonly action?: string;
  readonly query: string;
  readonly item: Readonly<IdItem<T>> | undefined;
  readonly selectedItems: Readonly<IdItem<T>>[] | undefined;
  readonly filteredItems: Readonly<IdItem<T>>[];
};

export type PickerOptions = {
  schedulerInterval?: number;
};

export class Picker<T> implements AsyncDisposable {
  readonly #stack = new AsyncDisposableStack();
  readonly #schedulerInterval: number;
  readonly #name: string;
  readonly #layout: Layout;
  readonly #collectProcessor: CollectProcessor<T>;
  readonly #matchProcessor: MatchProcessor<T>;
  readonly #visualizeProcessor: VisualizeProcessor<T>;
  readonly #previewProcessor?: PreviewProcessor<T>;
  readonly #inputComponent: InputComponent;
  readonly #listComponent: ListComponent;
  readonly #previewComponent?: PreviewComponent;
  #selection: Set<unknown> = new Set();
  #resized?: Size;

  constructor(params: PickerParams<T>, options: PickerOptions = {}) {
    this.#schedulerInterval = options.schedulerInterval ?? SCHEDULER_INTERVAL;
    this.#name = params.name;
    this.#layout = params.layout;

    const zindex = params.zindex ?? 50;
    const { screen, theme } = params;
    const isPreviewRequired = !!params.previewer;
    const borders = isPreviewRequired
      ? this.#layout.style3(theme)
      : this.#layout.style2(theme);
    const dimensions = isPreviewRequired
      ? this.#layout.layout3(screen)
      : this.#layout.layout2(screen);
    this.#inputComponent = this.#stack.use(
      new InputComponent({
        dimension: dimensions.input,
        border: borders.input,
        title: this.#name,
        zindex,
      }),
    );
    this.#listComponent = this.#stack.use(
      new ListComponent({
        dimension: dimensions.list,
        border: borders.list,
        zindex: zindex + 1,
      }),
    );
    if ("preview" in dimensions && "preview" in borders) {
      this.#previewComponent = this.#stack.use(
        new PreviewComponent({
          dimension: dimensions.preview as Dimension,
          border: borders.preview as Border,
          zindex: zindex + 2,
        }),
      );
    }

    this.#collectProcessor = this.#stack.use(
      new CollectProcessor(params.source),
    );
    this.#matchProcessor = this.#stack.use(
      new MatchProcessor(params.matcher),
    );
    this.#visualizeProcessor = this.#stack.use(
      new VisualizeProcessor(
        dimensions.list.height,
        params.sorter,
        params.renderer,
      ),
    );
    if (params.previewer) {
      this.#previewProcessor = this.#stack.use(
        new PreviewProcessor(params.previewer),
      );
    }
  }

  async open(
    denops: Denops,
    { signal }: { signal?: AbortSignal },
  ): Promise<AsyncDisposable> {
    await using stack = new AsyncDisposableStack();
    stack.use(await this.#inputComponent.open(denops, { signal }));
    stack.use(await this.#listComponent.open(denops, { signal }));
    stack.use(await this.#previewComponent?.open(denops, { signal }));
    // Emit 'FallPickerEnter/FallPickerLeave' autocmd
    stack.defer(async () => {
      await emitPickerLeave(denops, this.#name);
    });
    await emitPickerEnter(denops, this.#name);
    return stack.move();
  }

  async start(
    denops: Denops,
    { args }: { args: string[] },
    { signal }: { signal?: AbortSignal } = {},
  ): Promise<PickerResult<T> | undefined> {
    await using stack = new AsyncDisposableStack();

    this.#collectProcessor.start(denops, { args });
    stack.defer(() => this.#collectProcessor.pause());

    // Start mainloop
    let action: string | undefined;
    const accept = async (name: string) => {
      await Cmdliner.accept(denops);
      action = name;
    };
    const cmdliner = new Cmdliner({
      cmdline: this.#inputComponent.cmdline,
      cmdpos: this.#inputComponent.cmdpos,
    });
    const scheduler = stack.use(new Scheduler(this.#schedulerInterval));
    const waiter = scheduler.start(async () => {
      // Check cmdline/cmdpos
      await cmdliner.check(denops);

      // Handle events
      consume((event) => this.#handleEvent(denops, event, { accept }));

      // Resize components
      if (this.#resized) {
        const dimensions = this.#previewComponent
          ? this.#layout.layout3(this.#resized)
          : this.#layout.layout2(this.#resized);
        await this.#inputComponent.move(denops, dimensions.input, { signal });
        await this.#listComponent.move(denops, dimensions.list, { signal });
        if ("preview" in dimensions) {
          await this.#previewComponent?.move(
            denops,
            dimensions.preview as Dimension,
            { signal },
          );
        }
        this.#inputComponent.forceRender();
        this.#listComponent.forceRender();
        this.#previewComponent?.forceRender();
        this.#resized = undefined;
      }

      // Render components
      const renderResults = [
        await this.#inputComponent.render(denops, { signal }),
        await this.#listComponent.render(denops, { signal }),
        await this.#previewComponent?.render(denops, { signal }),
      ];
      if (renderResults.some((result) => result === true)) {
        await denops.cmd("redraw");
      }
    }, { signal });

    stack.defer(() => Cmdliner.cancel(denops));
    const query = await Promise.race([
      cmdliner.input(denops, { signal }),
      waiter,
    ]);
    if (query == null) {
      return;
    }

    const item = this.#matchProcessor.items[this.#visualizeProcessor.cursor];
    const selectedItems = this.#selection.size > 0
      ? this.#matchProcessor.items.filter((v) => this.#selection.has(v.id))
      : undefined;
    return {
      action,
      query,
      item,
      selectedItems,
      filteredItems: this.#matchProcessor.items,
    };
  }

  #select(
    cursor?: number | "$",
    method: "on" | "off" | "toggle" = "toggle",
  ): void {
    if (cursor === "$") {
      cursor = this.#matchProcessor.items.length - 1;
    }
    if (cursor === undefined) {
      cursor = this.#visualizeProcessor.cursor;
    }
    const item = this.#matchProcessor.items.at(cursor);
    if (!item) {
      return;
    }
    switch (method) {
      case "on":
        this.#selection.add(item.id);
        break;
      case "off":
        this.#selection.delete(item.id);
        break;
      case "toggle":
        if (this.#selection.has(item.id)) {
          this.#selection.delete(item.id);
        } else {
          this.#selection.add(item.id);
        }
        break;
      default:
        unreachable(method);
    }
  }

  #selectAll(
    method: "on" | "off" | "toggle" = "toggle",
  ): void {
    switch (method) {
      case "on":
        this.#selection = new Set(this.#matchProcessor.items.map((v) => v.id));
        break;
      case "off":
        this.#selection = new Set();
        break;
      case "toggle": {
        const isSelected = this.#selection.has.bind(this.#selection);
        this.#matchProcessor.items.forEach((v) => {
          if (isSelected(v.id)) {
            this.#selection.delete(v.id);
          } else {
            this.#selection.add(v.id);
          }
        });
        break;
      }
      default:
        unreachable(method);
    }
  }

  #handleEvent(denops: Denops, event: Event, { accept }: {
    accept: (name: string) => Promise<void>;
  }): void {
    switch (event.type) {
      case "debug-error":
        console.log(
          `[fall] 'debug-error' event has received: ${event.message}`,
        );
        throw new Error(event.message);
      case "vim-resized": {
        this.#resized = {
          width: event.width,
          height: event.height,
        };
        break;
      }
      case "vim-cmdline-changed":
        this.#inputComponent.cmdline = event.cmdline;
        this.#matchProcessor.start(denops, {
          items: this.#collectProcessor.items,
          query: event.cmdline,
        }, {
          restart: true,
        });
        break;
      case "vim-cmdpos-changed":
        this.#inputComponent.cmdpos = event.cmdpos;
        break;
      case "move-cursor": {
        const amplifier = event.scroll ? this.#listComponent.scroll : 1;
        this.#visualizeProcessor.cursor += event.amount * amplifier;
        this.#visualizeProcessor.start(denops, {
          items: this.#matchProcessor.items,
        });
        break;
      }
      case "move-cursor-at":
        this.#visualizeProcessor.cursor = event.cursor;
        this.#visualizeProcessor.start(denops, {
          items: this.#matchProcessor.items,
        });
        break;
      case "select-item":
        this.#select(event.cursor, event.method);
        this.#listComponent.selection = this.#selection;
        break;
      case "select-all-items":
        this.#selectAll(event.method);
        this.#listComponent.selection = this.#selection;
        break;
      case "action-invoke":
        accept(event.name);
        break;
      case "list-component-execute":
        this.#listComponent.execute(event.command);
        break;
      case "preview-component-execute":
        if (!this.#previewComponent) break;
        this.#previewComponent.execute(event.command);
        break;
      case "collect-processor-started":
        this.#inputComponent.collecting = true;
        break;
      case "collect-processor-updated":
        this.#inputComponent.collected = this.#collectProcessor.items.length;
        this.#matchProcessor.start(denops, {
          items: this.#collectProcessor.items,
          query: this.#inputComponent.cmdline,
        });
        break;
      case "collect-processor-succeeded":
        this.#inputComponent.collecting = false;
        break;
      case "collect-processor-failed": {
        if (event.err === null) {
          break;
        }
        this.#inputComponent.collecting = "failed";
        console.warn(`[fall] Failed to collect items:`, event.err);
        break;
      }
      case "match-processor-started":
        this.#inputComponent.processing = true;
        break;
      case "match-processor-updated":
        this.#inputComponent.processed = this.#matchProcessor.items.length;
        this.#visualizeProcessor.start(denops, {
          items: this.#matchProcessor.items,
        });
        break;
      case "match-processor-succeeded":
        this.#inputComponent.processing = false;
        this.#inputComponent.processed = this.#matchProcessor.items.length;
        this.#visualizeProcessor.start(denops, {
          items: this.#matchProcessor.items,
        });
        break;
      case "match-processor-failed": {
        if (event.err === null) {
          break;
        }
        this.#inputComponent.processing = "failed";
        console.warn(`[fall] Failed to filter items:`, event.err);
        break;
      }
      case "visualize-processor-started":
        break;
      case "visualize-processor-succeeded": {
        const line = this.#visualizeProcessor.line;
        this.#listComponent.items = this.#visualizeProcessor.items;
        this.#listComponent.execute(`silent! normal! ${line}G`);
        this.#previewProcessor?.start(denops, {
          item: this.#matchProcessor.items[this.#visualizeProcessor.cursor],
        });
        break;
      }
      case "visualize-processor-failed": {
        this.#inputComponent.processing = "failed";
        if (event.err === null) {
          break;
        }
        console.warn(`[fall] Failed to select items:`, event.err);
        break;
      }
      case "preview-processor-started":
        break;
      case "preview-processor-succeeded":
        if (this.#previewComponent && this.#previewProcessor) {
          this.#previewComponent.item = this.#previewProcessor.item;
        }
        break;
      case "preview-processor-failed": {
        this.#inputComponent.processing = "failed";
        if (event.err === null) {
          break;
        }
        console.warn(`[fall] Failed to preview an item:`, event.err);
        break;
      }
      default:
        unreachable(event);
    }
  }

  [Symbol.asyncDispose]() {
    return this.#stack[Symbol.asyncDispose]();
  }
}
