import type { Detail } from "jsr:@vim-fall/core@^0.3.0/item";
import type { Source } from "jsr:@vim-fall/core@^0.3.0/source";
import type { Action } from "jsr:@vim-fall/core@^0.3.0/action";

/**
 * Create a source for actions.
 */
export function action(
  actions: Record<string, Action<Detail>>,
): Source<Action<Detail>> {
  return {
    collect: async function* () {
      yield* Object.entries(actions).map(([name, action], id) => ({
        id,
        value: name,
        detail: action,
      }));
    },
  };
}
