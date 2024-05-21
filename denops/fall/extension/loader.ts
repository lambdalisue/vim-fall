import type { Denops } from "https://deno.land/x/denops_std@v6.4.0/mod.ts";
import { walk, WalkError } from "jsr:@std/fs@0.229.0/walk";
import { join } from "jsr:@std/path@0.225.0/join";
import { basename } from "jsr:@std/path@0.225.0/basename";

import { isDefined } from "../util/collection.ts";
import {
  type ExtensionConfig,
  getExtensionOptions,
} from "../config/extension.ts";
import {
  type Action,
  type Extension,
  type ExtensionType,
  type GetExtension,
  type Previewer,
  type Projector,
  type Renderer,
  type Source,
  type Transformer,
} from "./type.ts";

interface Loader<T> {
  name: string;
  script: string;
  load: (
    denops: Denops,
    options: Record<string, unknown>,
  ) => Promise<T | undefined>;
}

const registry = {
  source: new Map<string, Loader<Source>>(),
  transformer: new Map<string, Loader<Transformer>>(),
  projector: new Map<string, Loader<Projector>>(),
  renderer: new Map<string, Loader<Renderer>>(),
  previewer: new Map<string, Loader<Previewer>>(),
  action: new Map<string, Loader<Action>>(),
} satisfies Record<ExtensionType, Map<string, Loader<Extension>>>;

export async function loadExtension<
  T extends ExtensionType,
  R = GetExtension<T>,
>(
  denops: Denops,
  conf: ExtensionConfig,
  type: T,
  name: string,
): Promise<R | undefined> {
  try {
    const [root] = name.split(":", 1);
    const loader = registry[type].get(root);
    if (!loader) {
      throw new Error(`No ${type} extension '${root}' is registered`);
    }
    const opt = await loader.load(
      denops,
      getExtensionOptions(conf, type, name),
    );
    if (!opt) return;
    return {
      ...opt,
      script: loader.script,
      name,
    } as R;
  } catch (err) {
    console.error(`[fall] ${err.message ?? err}`);
  }
}

export async function loadExtensions<
  T extends ExtensionType,
  R = GetExtension<T>,
>(
  denops: Denops,
  conf: ExtensionConfig,
  type: T,
  names: readonly string[],
): Promise<readonly R[]> {
  const vs = await Promise.all(
    names.map((v) => loadExtension(denops, conf, type, v)),
  );
  return vs.filter(isDefined) as R[];
}

export function listExtensionNames<T extends ExtensionType>(
  type: T,
): readonly string[] {
  return [...registry[type].keys()];
}

export async function registerExtensionLoader(
  name: string,
  script: string,
): Promise<void> {
  const mod = await import(script);
  if (mod.getSource) {
    registry.source.set(name, {
      name,
      script,
      load: mod.getSource.bind(mod),
    });
  }
  if (mod.getTransformer) {
    registry.transformer.set(name, {
      name,
      script,
      load: mod.getTransformer.bind(mod),
    });
  }
  if (mod.getProjector) {
    registry.projector.set(name, {
      name,
      script,
      load: mod.getProjector.bind(mod),
    });
  }
  if (mod.getRenderer) {
    registry.renderer.set(name, {
      name,
      script,
      load: mod.getRenderer.bind(mod),
    });
  }
  if (mod.getPreviewer) {
    registry.previewer.set(name, {
      name,
      script,
      load: mod.getPreviewer.bind(mod),
    });
  }
  if (mod.getAction) {
    registry.action.set(name, {
      name,
      script,
      load: mod.getAction.bind(mod),
    });
  }
}

export async function discoverExtensionLoaders(
  runtimepath: string,
): Promise<void> {
  const walkOptions = {
    includeDirs: false,
    match: [/.*\.ts/],
  };
  const roots = runtimepath.split(",").map((v) =>
    join(v, "denops", "@fall-extension")
  );
  const promises: Promise<void>[] = [];
  for (const root of roots) {
    try {
      for await (const { path } of walk(root, walkOptions)) {
        promises.push(registerExtensionLoader(basename(path, ".ts"), path));
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
