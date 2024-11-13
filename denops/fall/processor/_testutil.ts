import { consume, type Event } from "../event.ts";

/**
 * Consume all dispatched events and return them.
 */
export function getDispatchedEvents(): Event[] {
  const events: Event[] = [];
  consume((event: Event) => {
    events.push(event);
  });
  return events;
}
