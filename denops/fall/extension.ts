import type { Denops } from "https://deno.land/x/denops_std@v6.4.0/mod.ts";
import { walk, WalkError } from "jsr:@std/fs@0.229.0/walk";
import { join } from "jsr:@std/path@0.225.0/join";
import { basename } from "jsr:@std/path@0.225.0/basename";
import { is, type Predicate } from "jsr:@core/unknownutil@3.18.0";
import type {
  Action,
  GetAction,
  GetPreviewer,
  GetProjector,
  GetRenderer,
  GetSource,
  GetTransformer,
  Previewer,
  Projector,
  Renderer,
  Source,
  Transformer,
} from "https://deno.land/x/fall_core@v0.10.0/mod.ts";
import { isDefined } from "./util/collection.ts";
import {
  type Config,
  getActionOptions,
  getPreviewerOptions,
  getProjectorOptions,
  getRendererOptions,
  getSourceOptions,
  getTransformerOptions,
} from "./config.ts";

const registry = {
  source: new Map<string, { getSource: GetSource }>(),
  filter: new Map<string, { getTransformer: GetTransformer }>(),
  sorter: new Map<string, { getProjector: GetProjector }>(),
  renderer: new Map<string, { getRenderer: GetRenderer }>(),
  previewer: new Map<string, { getPreviewer: GetPreviewer }>(),
  action: new Map<string, { getAction: GetAction }>(),
};

const isSourceModule = is.ObjectOf({
  getSource: is.Function as Predicate<GetSource>,
});

const isTransformerModule = is.ObjectOf({
  getTransformer: is.Function as Predicate<GetTransformer>,
});

const isProjectorModule = is.ObjectOf({
  getProjector: is.Function as Predicate<GetProjector>,
});

const isRendererModule = is.ObjectOf({
  getRenderer: is.Function as Predicate<GetRenderer>,
});

const isPreviewerModule = is.ObjectOf({
  getPreviewer: is.Function as Predicate<GetPreviewer>,
});

const isActionModule = is.ObjectOf({
  getAction: is.Function as Predicate<GetAction>,
});

export async function getSource(
  denops: Denops,
  expr: string,
  config: Config,
): Promise<Source | undefined> {
  try {
    const [name] = expr.split(":", 1);
    const mod = registry.source.get(name);
    if (!mod) {
      throw new Error(`No source '${name}' is registered`);
    }
    return await mod.getSource(denops, getSourceOptions(expr, config));
  } catch (err) {
    console.error(`[fall] ${err.message ?? err}`);
  }
}

export async function getTransformer(
  denops: Denops,
  expr: string,
  config: Config,
): Promise<Transformer | undefined> {
  try {
    const [name] = expr.split(":", 1);
    const mod = registry.filter.get(name);
    if (!mod) {
      throw new Error(`No filter '${name}' is registered`);
    }
    return await mod.getTransformer(
      denops,
      getTransformerOptions(expr, config),
    );
  } catch (err) {
    console.warn(`[fall] ${err.message ?? err}`);
  }
}

export async function getProjector(
  denops: Denops,
  expr: string,
  config: Config,
): Promise<Projector | undefined> {
  try {
    const [name] = expr.split(":", 1);
    const mod = registry.sorter.get(name);
    if (!mod) {
      throw new Error(`No sorter '${name}' is registered`);
    }
    return await mod.getProjector(denops, getProjectorOptions(expr, config));
  } catch (err) {
    console.warn(`[fall] ${err.message ?? err}`);
  }
}

export async function getRenderer(
  denops: Denops,
  expr: string,
  config: Config,
): Promise<Renderer | undefined> {
  try {
    const [name] = expr.split(":", 1);
    const mod = registry.renderer.get(name);
    if (!mod) {
      throw new Error(`No renderer '${name}' is registered`);
    }
    return await mod.getRenderer(denops, getRendererOptions(expr, config));
  } catch (err) {
    console.warn(`[fall] ${err.message ?? err}`);
  }
}

export async function getPreviewer(
  denops: Denops,
  expr: string,
  config: Config,
): Promise<Previewer | undefined> {
  try {
    const [name] = expr.split(":", 1);
    const mod = registry.previewer.get(name);
    if (!mod) {
      throw new Error(`No previewer '${name}' is registered`);
    }
    return await mod.getPreviewer(denops, getPreviewerOptions(expr, config));
  } catch (err) {
    console.warn(`[fall] ${err.message ?? err}`);
  }
}

export async function getAction(
  denops: Denops,
  expr: string,
  config: Config,
): Promise<Action | undefined> {
  try {
    const [name] = expr.split(":", 1);
    const mod = registry.action.get(name);
    if (!mod) {
      throw new Error(`No action '${name}' is registered`);
    }
    return await mod.getAction(denops, getActionOptions(expr, config));
  } catch (err) {
    console.warn(`[fall] ${err.message ?? err}`);
  }
}

type Extension =
  | Source
  | Transformer
  | Projector
  | Renderer
  | Previewer
  | Action;

export async function getExtensions<T extends Extension>(
  denops: Denops,
  exprs: string[],
  config: Config,
  getter: (
    denops: Denops,
    expr: string,
    config: Config,
  ) => Promise<T | undefined>,
): Promise<(readonly [string, T])[]> {
  const vs = await Promise.all(exprs.map(async (v) => {
    const ext = await getter(denops, v, config);
    if (ext) {
      return [v, ext] as const;
    }
  }));
  return vs.filter(isDefined);
}

export function list(
  type: string,
): string[] {
  return [...(registry[type as keyof typeof registry]?.keys() ?? [])];
}

export async function register(name: string, script: string): Promise<void> {
  const mod = await import(script);
  if (isSourceModule(mod)) {
    registry.source.set(name, mod);
  }
  if (isTransformerModule(mod)) {
    registry.filter.set(name, mod);
  }
  if (isProjectorModule(mod)) {
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
