import type { Denops } from "jsr:@denops/std@^7.3.0";
import type { CollectParams, Source } from "../../@fall/source.ts";
import type { Matcher, MatchParams } from "../../@fall/matcher.ts";
import type { Sorter, SortParams } from "../../@fall/sorter.ts";
import type { Renderer, RenderParams } from "../../@fall/renderer.ts";
import type { Previewer, PreviewParams } from "../../@fall/previewer.ts";
import { consume, type Event } from "../event.ts";

export function consumeDispatchedEvents(): Event[] {
  const dispatchedEvents: Event[] = [];
  consume((event) => dispatchedEvents.push(event));
  return dispatchedEvents;
}

export class DummySource implements Source<undefined> {
  async *collect(
    _denops: Denops,
    _params: CollectParams,
    _options: { signal?: AbortSignal },
  ) {
    for (let i = 0; i < 10; i++) {
      yield { id: i, value: i.toString(), detail: undefined };
    }
  }
}

export class DummyTickSource implements Source<undefined> {
  #waiter = Promise.withResolvers<void>();

  tick() {
    this.#waiter.resolve();
    this.#waiter = Promise.withResolvers<void>();
  }

  async *collect(
    _denops: Denops,
    _params: CollectParams,
    _options: { signal?: AbortSignal },
  ) {
    yield { id: 0, value: "0", detail: undefined };
    await this.#waiter.promise;
    yield { id: 1, value: "1", detail: undefined };
  }
}

export class DummyMatcher implements Matcher<undefined> {
  async *match(
    _denops: Denops,
    { items, query }: MatchParams<undefined>,
    _options: { signal?: AbortSignal },
  ) {
    for await (const item of items) {
      if (item.value.startsWith(query)) {
        yield item;
      }
    }
  }
}

export class DummySorter implements Sorter<undefined> {
  sort(
    _denops: Denops,
    { items }: SortParams<undefined>,
    _options: { signal?: AbortSignal },
  ) {
    items.sort((a, b) => b.value.localeCompare(a.value));
  }
}

export class DummyRenderer implements Renderer<undefined> {
  render(
    _denops: Denops,
    { items }: RenderParams<undefined>,
    _options: { signal?: AbortSignal },
  ) {
    items.forEach((item) => {
      item.label = `LABELED: ${item.value}`;
    });
  }
}

export class DummyPreviewer implements Previewer<undefined> {
  preview(
    _denops: Denops,
    { item }: PreviewParams<undefined>,
    _options: { signal?: AbortSignal },
  ) {
    return {
      content: [JSON.stringify(item)],
    };
  }
}
