import { match, placeholder as _ } from "jsr:@core/match@0.2.5";

// deno-fmt-ignore
const pattern = _`https://github.com/${_("owner")}/${_("repo")}/blob/${_("rev")}/${_("path")}`;

export function resolve(
  uri: string,
): Promise<URL | undefined> {
  const m = match(pattern, uri);
  if (!m) return Promise.resolve(undefined);
  const { owner, repo, rev, path } = m;
  return Promise.resolve(
    new URL(
      `https://raw.githubusercontent.com/${owner}/${repo}/${rev}/${path}`,
    ),
  );
}
