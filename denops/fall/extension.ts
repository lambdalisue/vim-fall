import { is, type Predicate } from "jsr:@core/unknownutil@3.18.0";
import type {
  Action,
  ActionModule,
  Filter,
  FilterModule,
  Previewer,
  PreviewerModule,
  Renderer,
  RendererModule,
  Sorter,
  SorterModule,
  Source,
  SourceModule,
} from "https://deno.land/x/fall_core@v0.8.0/mod.ts";
import type { Config } from "./config.ts";
import * as config from "./config.ts";

const registry = {
  source: new Map<string, SourceModule>(),
  filter: new Map<string, FilterModule>(),
  sorter: new Map<string, SorterModule>(),
  renderer: new Map<string, RendererModule>(),
  previewer: new Map<string, PreviewerModule>(),
  action: new Map<string, ActionModule>(),
};

const isSourceModule = is.ObjectOf({
  getSource: is.Function as Predicate<SourceModule["getSource"]>,
}) satisfies Predicate<SourceModule>;

const isFilterModule = is.ObjectOf({
  getFilter: is.Function as Predicate<FilterModule["getFilter"]>,
}) satisfies Predicate<FilterModule>;

const isSorterModule = is.ObjectOf({
  getSorter: is.Function as Predicate<SorterModule["getSorter"]>,
}) satisfies Predicate<SorterModule>;

const isRendererModule = is.ObjectOf({
  getRenderer: is.Function as Predicate<RendererModule["getRenderer"]>,
}) satisfies Predicate<RendererModule>;

const isPreviewerModule = is.ObjectOf({
  getPreviewer: is.Function as Predicate<PreviewerModule["getPreviewer"]>,
}) satisfies Predicate<PreviewerModule>;

const isActionModule = is.ObjectOf({
  getAction: is.Function as Predicate<ActionModule["getAction"]>,
}) satisfies Predicate<ActionModule>;

export async function register(name: string, script: string): Promise<void> {
  const mod = await import(script);
  if (isSourceModule(mod)) {
    registry.source.set(name, mod);
  }
  if (isFilterModule(mod)) {
    registry.filter.set(name, mod);
  }
  if (isSorterModule(mod)) {
    registry.sorter.set(name, mod);
  }
  if (isRendererModule(mod)) {
    registry.renderer.set(name, mod);
  }
  if (isPreviewerModule(mod)) {
    registry.previewer.set(name, mod);
  }
  if (isActionModule(mod)) {
    registry.action.set(name, mod);
  }
}

export function getSource(expr: string, conf: Config): Source | undefined {
  try {
    const [name] = expr.split(":", 1);
    const mod = registry.source.get(name);
    if (!mod) {
      throw new Error(`No source '${name}' is registered`);
    }
    return mod.getSource(config.getSourceOptions(expr, conf));
  } catch (err) {
    console.error(`[fall] ${err.message ?? err}`);
  }
}

export function getFilter(expr: string, conf: Config): Filter | undefined {
  try {
    const [name] = expr.split(":", 1);
    const mod = registry.filter.get(name);
    if (!mod) {
      throw new Error(`No filter '${name}' is registered`);
    }
    return mod.getFilter(config.getFilterOptions(expr, conf));
  } catch (err) {
    console.warn(`[fall] ${err.message ?? err}`);
  }
}

export function getSorter(expr: string, conf: Config): Sorter | undefined {
  try {
    const [name] = expr.split(":", 1);
    const mod = registry.sorter.get(name);
    if (!mod) {
      throw new Error(`No sorter '${name}' is registered`);
    }
    return mod.getSorter(config.getSorterOptions(expr, conf));
  } catch (err) {
    console.warn(`[fall] ${err.message ?? err}`);
  }
}

export function getRenderer(expr: string, conf: Config): Renderer | undefined {
  try {
    const [name] = expr.split(":", 1);
    const mod = registry.renderer.get(name);
    if (!mod) {
      throw new Error(`No renderer '${name}' is registered`);
    }
    return mod.getRenderer(config.getRendererOptions(expr, conf));
  } catch (err) {
    console.warn(`[fall] ${err.message ?? err}`);
  }
}

export function getPreviewer(
  expr: string,
  conf: Config,
): Previewer | undefined {
  try {
    const [name] = expr.split(":", 1);
    const mod = registry.previewer.get(name);
    if (!mod) {
      throw new Error(`No previewer '${name}' is registered`);
    }
    return mod.getPreviewer(config.getPreviewerOptions(expr, conf));
  } catch (err) {
    console.warn(`[fall] ${err.message ?? err}`);
  }
}

export function getAction(expr: string, conf: Config): Action | undefined {
  try {
    const [name] = expr.split(":", 1);
    const mod = registry.action.get(name);
    if (!mod) {
      throw new Error(`No action '${name}' is registered`);
    }
    return mod.getAction(config.getActionOptions(expr, conf));
  } catch (err) {
    console.warn(`[fall] ${err.message ?? err}`);
  }
}
