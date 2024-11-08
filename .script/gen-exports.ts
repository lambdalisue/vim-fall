import {
  dirname,
  fromFileUrl,
  globToRegExp,
  relative,
} from "jsr:@std/path@^1.0.8";
import { walk } from "jsr:@std/fs@^1.0.5";
import { parse } from "jsr:@std/jsonc@^1.0.1";

const excludes = [
  "*_test.ts",
  "*_bench.ts",
  "_*.ts",
];

async function generateExports(
  path: string,
): Promise<Record<string, string>> {
  const patterns = excludes.map((p) => globToRegExp(p));
  const root = fromFileUrl(new URL("../", import.meta.url));
  const it = walk(path, {
    includeFiles: true,
    includeDirs: false,
  });
  const exports: Record<string, string> = {};
  for await (const entry of it) {
    if (!entry.name.endsWith(".ts")) continue;
    if (patterns.some((p) => p.test(entry.name))) continue;
    const exportName = [".", relative(path, normalizeExportName(entry.path))]
      .filter((v) => !!v)
      .join("/");
    const exportPath = [".", relative(root, entry.path)]
      .filter((v) => !!v)
      .join("/");
    exports[exportName] = exportPath;
  }
  return Object.fromEntries(Object.entries(exports).toSorted());
}

function normalizeExportName(name: string): string {
  if (name.endsWith("/mod.ts")) {
    name = dirname(name);
  }
  name = name.replace(/\.ts$/, "");
  name = name.replace(/_/g, "-");
  return name;
}

if (import.meta.main) {
  const exports = await generateExports(
    fromFileUrl(new URL("../denops/@fall", import.meta.url)),
  );
  const denoJsoncPath = new URL("../deno.jsonc", import.meta.url);
  const denoJsonc = parse(await Deno.readTextFile(denoJsoncPath)) as Record<
    string,
    unknown
  >;
  await Deno.writeTextFile(
    denoJsoncPath,
    JSON.stringify(
      {
        ...denoJsonc,
        exports,
      },
      undefined,
      2,
    ),
  );
}
