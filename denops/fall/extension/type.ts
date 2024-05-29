import type { Denops } from "https://deno.land/x/denops_std@v6.4.0/mod.ts";
import { is, type Predicate } from "jsr:@core/unknownutil@3.18.0";
import type * as core from "../../@fall/mod.ts";

export type {
  ActionItem,
  ActionParams,
  Item,
  Preview,
  PreviewerItem,
  PreviewerParams,
  ProjectorParams,
  RendererItem,
  RendererParams,
  SourceItem,
  SourceParams,
} from "../../@fall/mod.ts";

type ExtensionBase = {
  readonly name: string;
};

export type Source = core.Source & ExtensionBase;
export type Projector = core.Projector & ExtensionBase;
export type Renderer = core.Renderer & ExtensionBase;
export type Previewer = core.Previewer & ExtensionBase;
export type Action = core.Action & ExtensionBase;

export type ExtensionType =
  | "source"
  | "projector"
  | "renderer"
  | "previewer"
  | "action";

export type Extension =
  | Source
  | Projector
  | Renderer
  | Previewer
  | Action;

export type GetExtension<T extends ExtensionType> = T extends "source" ? Source
  : T extends "projector" ? Projector
  : T extends "renderer" ? Renderer
  : T extends "previewer" ? Previewer
  : T extends "action" ? Action
  : never;

export const isExtensionType = is.LiteralOneOf(
  [
    "source",
    "projector",
    "renderer",
    "previewer",
    "action",
  ] as const,
) satisfies Predicate<ExtensionType>;

export type ExtensionLoader<T> = {
  readonly name: string;
  readonly script: string;
  readonly load: (
    denops: Denops,
    options: Record<string, unknown>,
  ) => Promise<T | undefined>;
};
