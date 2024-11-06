import type { Denops } from "jsr:@denops/std@^7.3.0";
import type { Action, InvokeParams } from "../../action.ts";
import type { Matcher } from "../../matcher.ts";
import type { Renderer } from "../../renderer.ts";
import type { Theme } from "../../theme.ts";
import type { Sorter } from "../../sorter.ts";
import type { Previewer } from "../../previewer.ts";
import type { Layout } from "../../layout.ts";
import type { Actions, GlobalConfig, ItemPickerParams } from "../../config.ts";
import { ListSource } from "../source/list.ts";

type Options<T, A extends string> = {
  actions?: Actions<T, A>;
  defaultAction?: A;
  sorter?: Sorter<T> | null;
  renderer?: Renderer<T> | null;
  previewer?: Previewer<T> | null;
  layout?: Layout | null;
  theme?: Theme | null;
};

export class SubmatchAction<T, A extends string> implements Action<T> {
  #matcher: Matcher<T>;
  #options: Options<T, string>;

  constructor(matcher: Matcher<T>, options: Options<T, A> = {}) {
    this.#matcher = matcher;
    this.#options = options;
  }

  async invoke(
    denops: Denops,
    { selectedItems, filteredItems, context }: InvokeParams<T>,
    { signal }: { signal?: AbortSignal },
  ): Promise<void | true> {
    const params: ItemPickerParams<T, string> & GlobalConfig = {
      ...context.pickerParams,
      source: new ListSource(selectedItems ?? filteredItems),
      matcher: this.#matcher,
    };
    if (this.#options.actions) {
      params.actions = this.#options.actions;
    }
    if (this.#options.defaultAction) {
      params.defaultAction = this.#options.defaultAction;
    }
    if (this.#options.sorter !== undefined) {
      params.sorter = this.#options.sorter ?? undefined;
    }
    if (this.#options.renderer !== undefined) {
      params.renderer = this.#options.renderer ?? undefined;
    }
    if (this.#options.previewer !== undefined) {
      params.previewer = this.#options.previewer ?? undefined;
    }
    if (this.#options.layout !== undefined) {
      params.layout = this.#options.layout ?? context.globalConfig.layout;
    }
    if (this.#options.theme !== undefined) {
      params.theme = this.#options.theme ?? context.globalConfig.theme;
    }
    const result = await denops.dispatch(
      "fall",
      "picker:start",
      [],
      context.screen,
      params,
      { signal },
    );
    if (result) {
      return true;
    }
  }
}
