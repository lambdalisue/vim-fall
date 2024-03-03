import type { Denops } from "https://deno.land/x/denops_std@v6.3.0/mod.ts";
import type { Decoration } from "https://deno.land/x/denops_std@v6.3.0/buffer/decoration.ts";

export type ItemDecoration =
  & Omit<Decoration, "line" | "highlight">
  & Partial<Pick<Decoration, "highlight">>;

export type SourceItem = {
  value: string;
  label?: string;
  detail?: unknown;
};

export type PickerItem = SourceItem & {
  id: string;
};

export type PresentationItem = PickerItem & {
  decorations?: ItemDecoration[];
};

export type Source = (
  denops: Denops,
  ...args: string[]
) => ReadableStream<SourceItem> | Promise<ReadableStream<SourceItem>>;

export type Filter = (
  denops: Denops,
  items: PresentationItem[],
  query: string,
  options?: { signal?: AbortSignal },
) => PresentationItem[] | Promise<PresentationItem[]>;

export type Processor = (
  denops: Denops,
  items: PresentationItem[],
  options?: { signal?: AbortSignal },
) => PresentationItem[] | Promise<PresentationItem[]>;

export type Continue = true;

export type Action = (
  denops: Denops,
  items: PickerItem[],
  options?: { signal?: AbortSignal },
) => (Continue | void) | Promise<Continue | void>;

export type PreviewItem = {
  path: string;
  line?: number;
  column?: number;
};

export type Previewer = (
  denops: Denops,
  item: PresentationItem,
  options?: { signal?: AbortSignal },
) => (PreviewItem | undefined) | Promise<PreviewItem | undefined>;
