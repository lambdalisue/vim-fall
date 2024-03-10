import { match, placeholder as _ } from "jsr:@core/match@0.2.5";

import { isExtensionKind } from "../../config/extension.ts";
import { getPackage } from "../../config/registry.ts";

const pattern = _`package:${_("pkg")}:${_("kind")}/${_("name")}`;

export function resolve(
  uri: string,
): Promise<URL | undefined> {
  const m = match(pattern, uri);
  if (!m) return Promise.resolve(undefined);
  const { kind, name } = m;

  const pkg = getPackage(m.pkg);
  if (!pkg) {
    throw new Error(`No package '${m.pkg}' found in the registry`);
  }

  if (!isExtensionKind(kind)) {
    throw new Error(
      `Invalid extension kind '${kind}' is specified in '${uri}'`,
    );
  }
  const extensionMap = pkg[kind];
  if (!extensionMap) {
    throw new Error(
      `No ${kind} extensions found in the package '${m.pkg}'`,
    );
  }

  const extension = extensionMap[name];
  if (!extension) {
    throw new Error(
      `No ${kind} extension '${name}' found in the package '${m.pkg}'`,
    );
  }
  return Promise.resolve(new URL(extension.url, pkg.base));
}
