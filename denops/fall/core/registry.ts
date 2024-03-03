import type { Action, Filter, Previewer, Processor, Source } from "../types.ts";

export const registry = {
  source: new Map<string, Promise<Source>>(),
  action: new Map<string, Promise<Action>>(),
  filter: new Map<string, Promise<Filter>>(),
  sorter: new Map<string, Promise<Processor>>(),
  presenter: new Map<string, Promise<Processor>>(),
  previewer: new Map<string, Promise<Previewer>>(),
};

export function loadSource(
  name: string,
): Promise<Source> {
  const mod = registry.source.get(name);
  if (!mod) {
    throw new Error(`[fall] Source '${name}' is not registered`);
  }
  return mod;
}

export function loadPreviewer(
  name: string,
): Promise<Previewer> {
  const mod = registry.previewer.get(name);
  if (!mod) {
    throw new Error(`[fall] Previewer '${name}' is not registered`);
  }
  return mod;
}

export async function loadActions(
  exprs: string[],
): Promise<Map<string, Action>> {
  const ms = await Promise.all(
    exprs.map((expr) => loadModules("Action", expr, registry.action)),
  );
  return new Map(ms.flatMap((m) => Array.from(m.entries())));
}

export async function loadFilters(
  exprs: string[],
): Promise<Map<string, Filter>> {
  const ms = await Promise.all(
    exprs.map((expr) => loadModules("Filter", expr, registry.filter)),
  );
  return new Map(ms.flatMap((m) => Array.from(m.entries())));
}

export async function loadSorters(
  exprs: string[],
): Promise<Map<string, Processor>> {
  const ms = await Promise.all(
    exprs.map((expr) => loadModules("Sorter", expr, registry.sorter)),
  );
  return new Map(ms.flatMap((m) => Array.from(m.entries())));
}

export async function loadPresenters(
  exprs: string[],
): Promise<Map<string, Processor>> {
  const ms = await Promise.all(
    exprs.map((expr) => loadModules("Presenter", expr, registry.presenter)),
  );
  return new Map(ms.flatMap((m) => Array.from(m.entries())));
}

async function loadModules<T>(
  kind: string,
  expr: string,
  registry: Map<string, Promise<T>>,
): Promise<Map<string, T>> {
  // NOTE:
  // Since Fuzzy Finder is often used for day-to-day operations, we try to ignore any misconfigurations
  // except for Source so that it will work as well as possible even if there are some misconfigurations.
  if (!expr.includes("*")) {
    const mod = registry.get(expr);
    if (!mod) {
      console.warn(`[fall] ${kind} '${expr}' is not registered`);
      return new Map();
    }
    try {
      return new Map([[expr, await mod]]);
    } catch (err) {
      console.warn(`[fall] ${kind} '${expr}' is invalid: ${err}`);
      return new Map();
    }
  }
  // Check the number of "*"
  const terms = expr.split("*");
  if (terms.length > 3) {
    console.warn(
      `[fall] ${kind} name expression is invalid: '*' must not be specified more than once: ${expr}`,
    );
    return new Map();
  }
  const [prefix, _, suffix = ""] = terms;
  const mods = await Promise.all(
    Array
      .from(registry.entries())
      .filter(([name]) => name.startsWith(prefix) && name.endsWith(suffix))
      .map(async ([name, mod]) => {
        try {
          return [name, await mod] as const;
        } catch (err) {
          console.warn(`[fall] ${kind} '${name}' is invalid: ${err}`);
          return undefined;
        }
      }),
  );
  return new Map(mods.filter(isDefined));
}

function isDefined<T>(x: T | undefined): x is T {
  return x !== undefined;
}
