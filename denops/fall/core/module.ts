import type { Denops } from "https://deno.land/x/denops_std@v6.3.0/mod.ts";
import {
  is,
  type PredicateType,
} from "https://deno.land/x/unknownutil@v3.16.3/mod.ts";

export const isModule = is.ObjectOf({
  uri: is.String,
  name: is.OptionalOf(is.String),
  options: is.OptionalOf(is.RecordOf(is.Unknown, is.String)),
});

export type Module = PredicateType<typeof isModule>;

export type Factory<T> = (
  denops: Denops,
  options: Record<string, unknown>,
) => Promise<T>;

export async function importModule<T>(
  denops: Denops,
  module: Module,
): Promise<T | undefined> {
  const url = uriToUrl(module.uri);
  const mod = await import(url.href);
  const factory = mod[module.name ?? "default"] as Factory<T>;
  return await factory(denops, module.options ?? {});
}

function uriToUrl(uri: string): URL {
  if (uri.startsWith("builtin:")) {
    // e.g. `builtin:sources/line.ts`
    const path = uri.slice(8);
    return new URL(`../../@fall-builtin/${path}`, import.meta.url);
  } else if (uri.startsWith("github:")) {
    // e.g. `github:lambdalisue/fall-extensions/main/sources/my_source.ts`
    const path = uri.slice(7);
    return new URL(
      `https://raw.githubusercontent.com/${path}`,
    );
  }
  return new URL(uri);
}
