import {
  is,
  type Predicate,
  type PredicateType,
} from "jsr:@core/unknownutil@3.18.0";

/**
 * Subscribe to an event.
 *
 * @param name The name of the event to subscribe to.
 * @param callback The callback to be called when the event is dispatched.
 * @returns A disposable object that can be used to unsubscribe from the event.
 */
export function subscribe<K extends keyof FallEventDataMap>(
  name: K,
  callback: FallEventCallback<K>,
): Disposable {
  const subscribers = subscriberMap[name] ?? new Set();
  subscribers.add(callback);
  (subscriberMap as Record<K, Set<FallEventCallback<K>>>)[name] = subscribers;
  return {
    [Symbol.dispose]: () => {
      const subscribers = subscriberMap[name] ?? new Set();
      subscribers.delete(callback);
    },
  };
}

/**
 * Dispatch an event.
 *
 * @param name The name of the event to dispatch.
 * @param data The data to be dispatched with the event.
 */
export function dispatch<
  K extends keyof FallEventDataMap,
>(name: K, data: FallEventDataMap[K]): void {
  const subscribers = subscriberMap[name] ?? new Set();
  for (const subscriber of subscribers) {
    subscriber(data);
  }
}

/**
 * Return true if the value is a fall event name.
 */
export function isFallEventName(
  v: unknown,
): v is keyof typeof fallEventDataMap {
  return is.String(v) && v in fallEventDataMap;
}

type FallEventCallback<K extends keyof FallEventDataMap> = (
  data: FallEventDataMap[K],
) => unknown;

type FallEventDataMap = {
  [K in keyof typeof fallEventDataMap]: PredicateType<
    typeof fallEventDataMap[K]
  >;
};

const subscriberMap: {
  [K in keyof FallEventDataMap]?: Set<FallEventCallback<K>>;
} = {};

const fallEventDataMap = {
  "cmdline-changed": is.String,
  "cmdpos-changed": is.Number,
  "selector-cursor-move": is.Number,
  "selector-cursor-move-at": is.UnionOf([is.Number, is.LiteralOf("$")]),
  "selector-select": is.Unknown,
  "selector-select-all": is.Unknown,
  "preview-cursor-move": is.Number,
  "preview-cursor-move-at": is.Number,
  "action-invoke": is.String,
  "item-collector-changed": is.Unknown,
  "item-collector-succeeded": is.Unknown,
  "item-collector-failed": is.Unknown,
  "item-collector-completed": is.Unknown,
  "item-processor-succeeded": is.Unknown,
  "item-processor-failed": is.Unknown,
  "item-processor-completed": is.Unknown,
  "item-formatter-succeeded": is.Unknown,
  "item-formatter-failed": is.Unknown,
  "item-formatter-completed": is.Unknown,
} as const satisfies Record<string, Predicate<unknown>>;
