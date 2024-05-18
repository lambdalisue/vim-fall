import { is, type Predicate } from "jsr:@core/unknownutil@3.18.0";
import type * as core from "../../@fall/mod.ts";

export type {
  ActionItem,
  ActionParams,
  Item,
  PreviewerItem,
  PreviewerParams,
  ProjectorParams,
  RendererItem,
  RendererParams,
  SourceItem,
  SourceParams,
  TransformerParams,
} from "../../@fall/mod.ts";

type ExtensionBase = {
  readonly name: string;
};

export type Source = core.Source & ExtensionBase;
export type Transformer = core.Transformer & ExtensionBase;
export type Projector = core.Projector & ExtensionBase;
export type Renderer = core.Renderer & ExtensionBase;
export type Previewer = core.Previewer & ExtensionBase;
export type Action = core.Action & ExtensionBase;

export type ExtensionType =
  | "source"
  | "transformer"
  | "projector"
  | "renderer"
  | "previewer"
  | "action";

export type Extension =
  | Source
  | Transformer
  | Projector
  | Renderer
  | Previewer
  | Action;

export type GetExtension<T extends ExtensionType> = T extends "source" ? Source
  : T extends "transformer" ? Transformer
  : T extends "projector" ? Projector
  : T extends "renderer" ? Renderer
  : T extends "previewer" ? Previewer
  : T extends "action" ? Action
  : never;

export const isExtensionType = is.LiteralOneOf(
  [
    "source",
    "transformer",
    "projector",
    "renderer",
    "previewer",
    "action",
  ] as const,
) satisfies Predicate<ExtensionType>;
