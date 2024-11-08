import { defineMatcher, type Matcher } from "../../matcher.ts";

export function noop<T>(): Matcher<T> {
  return defineMatcher<T>(async function* () {});
}
