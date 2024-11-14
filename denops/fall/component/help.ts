import type { Denops } from "jsr:@denops/std@^7.3.2";
import type { Decoration } from "jsr:@denops/std@^7.3.2/buffer";
import * as mapping from "jsr:@denops/std@^7.3.2/mapping";
import * as fn from "jsr:@denops/std@^7.3.2/function";
import * as buffer from "jsr:@denops/std@^7.3.2/buffer";
import type { Dimension } from "jsr:@vim-fall/std@^0.4.0/coordinator";

import { BaseComponent } from "./_component.ts";
import { ItemBelt } from "../lib/item_belt.ts";

export type Page = {
  readonly title?: string;
  readonly content: readonly string[];
  readonly decorations?: readonly Decoration[];
};

export class HelpComponent extends BaseComponent {
  readonly #pages = new ItemBelt<Page>([]);
  #modifiedContent = true;

  get page(): number {
    return this.#pages.index + 1;
  }

  set page(page: number | "$") {
    if (page === "$") {
      page = this.#pages.count;
    }
    this.#pages.index = page - 1;
    this.#modifiedContent = true;
  }

  get pages(): readonly Page[] {
    return this.#pages.items;
  }

  set pages(pages: readonly Page[]) {
    this.#pages.items = pages;
    this.#modifiedContent = true;
  }

  forceRender(): void {
    this.#modifiedContent = true;
  }

  override async open(
    denops: Denops,
    dimension: Readonly<Dimension>,
    { signal }: { signal?: AbortSignal } = {},
  ): Promise<AsyncDisposable> {
    await using stack = new AsyncDisposableStack();
    stack.use(await super.open(denops, dimension, { signal }));
    const { winid } = this.info!;

    signal?.throwIfAborted();
    await fn.win_execute(
      denops,
      winid,
      "setlocal nocursorline signcolumn=no nowrap nofoldenable nonumber norelativenumber filetype=fall-document",
    );

    this.forceRender();
    return stack.move();
  }

  override async render(
    denops: Denops,
    { signal }: { signal?: AbortSignal } = {},
  ): Promise<true | void> {
    try {
      const results = [
        await this.#renderContent(denops, { signal }),
      ];
      return results.some((result) => result) ? true : undefined;
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      const m = err instanceof Error ? err.message : String(err);
      console.warn(`Failed to render content of the list component: ${m}`);
    }
  }

  async #renderContent(
    denops: Denops,
    { signal }: { signal?: AbortSignal } = {},
  ): Promise<true | void> {
    if (!this.#modifiedContent || !this.info) return;
    this.#modifiedContent = false;

    const { bufnr, dimension: { width } } = this.info;

    const page = this.#pages.current;
    const content = [
      await this.#buildNavigationHeader(denops, width, { signal }),
      ...(page?.content ?? []),
    ];
    const decorations = [
      {
        line: 1,
        column: 1,
        length: width,
        highlight: "FallHelpHeader",
      },
      ...(page?.decorations ?? []).map((d) => ({
        ...d,
        line: d.line + 1,
      })),
    ];

    signal?.throwIfAborted();
    await buffer.replace(denops, bufnr, content);
    signal?.throwIfAborted();
    await buffer.undecorate(denops, bufnr);
    signal?.throwIfAborted();
    await buffer.decorate(denops, bufnr, decorations);

    return true;
  }

  async #buildNavigationHeader(
    denops: Denops,
    width: number,
    { signal }: { signal?: AbortSignal } = {},
  ): Promise<string> {
    const mappings = await mapping.list(denops, "", { mode: "c" });
    signal?.throwIfAborted();
    const prev = mappings.find((m) => m.rhs === "<Plug>(fall-help-prev)");
    const next = mappings.find((m) => m.rhs === "<Plug>(fall-help-next)");
    const navigator = [prev?.lhs, next?.lhs].filter((v) => !!v).join(" / ");
    const pager = `Page ${this.page}/${this.#pages.count}`;
    const spacer = " ".repeat(width - pager.length - navigator.length);
    return `${pager}${spacer}${navigator}`;
  }
}
