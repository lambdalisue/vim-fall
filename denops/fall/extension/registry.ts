import { walk } from "jsr:@std/fs@^1.0.0/walk";
import { join } from "jsr:@std/path@^1.0.0/join";
import { basename } from "jsr:@std/path@^1.0.0/basename";

import type {
  Action,
  Extension,
  ExtensionLoader,
  ExtensionType,
  Previewer,
  Projector,
  Renderer,
  Source,
} from "./type.ts";

export const registry = {
  source: new Map<string, ExtensionLoader<Source>>(),
  projector: new Map<string, ExtensionLoader<Projector>>(),
  renderer: new Map<string, ExtensionLoader<Renderer>>(),
  previewer: new Map<string, ExtensionLoader<Previewer>>(),
  action: new Map<string, ExtensionLoader<Action>>(),
} as const satisfies Readonly<
  Record<ExtensionType, Map<string, ExtensionLoader<Extension>>>
>;

export async function registerExtensionLoader(
  name: string,
  script: string,
): Promise<void> {
  const mod = await import(script);
  if (mod.getSource) {
    registry.source.set(name, {
      type: "source",
      name,
      script,
      load: mod.getSource.bind(mod),
    });
  }
  if (mod.getProjector) {
    registry.projector.set(name, {
      type: "projector",
      name,
      script,
      load: mod.getProjector.bind(mod),
    });
  }
  if (mod.getRenderer) {
    registry.renderer.set(name, {
      type: "renderer",
      name,
      script,
      load: mod.getRenderer.bind(mod),
    });
  }
  if (mod.getPreviewer) {
    registry.previewer.set(name, {
      type: "previewer",
      name,
      script,
      load: mod.getPreviewer.bind(mod),
    });
  }
  if (mod.getAction) {
    registry.action.set(name, {
      type: "action",
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
      if (err instanceof Deno.errors.NotFound) {
        continue;
      }
      throw err;
    }
  }
  await Promise.allSettled(promises);
}
