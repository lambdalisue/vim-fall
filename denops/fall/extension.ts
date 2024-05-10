import { walk, WalkError } from "jsr:@std/fs@0.229.0/walk";
import { join } from "jsr:@std/path@0.225.0/join";
import { basename } from "jsr:@std/path@0.225.0/basename";
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
import {
  type Config,
  getActionOptions,
  getFilterOptions,
  getPreviewerOptions,
  getRendererOptions,
  getSorterOptions,
  getSourceOptions,
} from "./config.ts";

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

export function getSource(expr: string, config: Config): Source | undefined {
  try {
    const [name] = expr.split(":", 1);
    const mod = registry.source.get(name);
    if (!mod) {
      throw new Error(`No source '${name}' is registered`);
    }
    return mod.getSource(getSourceOptions(expr, config));
  } catch (err) {
    console.error(`[fall] ${err.message ?? err}`);
  }
}

export function getFilter(expr: string, config: Config): Filter | undefined {
  try {
    const [name] = expr.split(":", 1);
    const mod = registry.filter.get(name);
    if (!mod) {
      throw new Error(`No filter '${name}' is registered`);
    }
    return mod.getFilter(getFilterOptions(expr, config));
  } catch (err) {
    console.warn(`[fall] ${err.message ?? err}`);
  }
}

export function getSorter(expr: string, config: Config): Sorter | undefined {
  try {
    const [name] = expr.split(":", 1);
    const mod = registry.sorter.get(name);
    if (!mod) {
      throw new Error(`No sorter '${name}' is registered`);
    }
    return mod.getSorter(getSorterOptions(expr, config));
  } catch (err) {
    console.warn(`[fall] ${err.message ?? err}`);
  }
}

export function getRenderer(
  expr: string,
  config: Config,
): Renderer | undefined {
  try {
    const [name] = expr.split(":", 1);
    const mod = registry.renderer.get(name);
    if (!mod) {
      throw new Error(`No renderer '${name}' is registered`);
    }
    return mod.getRenderer(getRendererOptions(expr, config));
  } catch (err) {
    console.warn(`[fall] ${err.message ?? err}`);
  }
}

export function getPreviewer(
  expr: string,
  config: Config,
): Previewer | undefined {
  try {
    const [name] = expr.split(":", 1);
    const mod = registry.previewer.get(name);
    if (!mod) {
      throw new Error(`No previewer '${name}' is registered`);
    }
    return mod.getPreviewer(getPreviewerOptions(expr, config));
  } catch (err) {
    console.warn(`[fall] ${err.message ?? err}`);
  }
}

export function getAction(expr: string, config: Config): Action | undefined {
  try {
    const [name] = expr.split(":", 1);
    const mod = registry.action.get(name);
    if (!mod) {
      throw new Error(`No action '${name}' is registered`);
    }
    return mod.getAction(getActionOptions(expr, config));
  } catch (err) {
    console.warn(`[fall] ${err.message ?? err}`);
  }
}

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

export async function discover(runtimepath: string): Promise<void> {
  const walkOptions = {
    includeDirs: false,
    match: [/.*\.ts/],
  };
  const roots = runtimepath.split(",").map((v) =>
    join(v, "denops", "@fall-extensions")
  );
  const promises: Promise<void>[] = [];
  for (const root of roots) {
    try {
      for await (const { path } of walk(root, walkOptions)) {
        promises.push(register(basename(path, ".ts"), path));
      }
    } catch (err) {
      if (err instanceof WalkError) {
        continue;
      }
      throw err;
    }
  }
  await Promise.allSettled(promises);
}
