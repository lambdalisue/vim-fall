const baseUrl =
  "https://github.com/lambdalisue/vim-nerdfont/raw/refs/heads/master/assets/json/";

async function download(filename: string): Promise<void> {
  const url = new URL(filename, baseUrl);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}`);
  }
  const text = await response.text();
  await Deno.writeTextFile(
    new URL(
      filename,
      new URL("../denops/@fall/builtin/renderer/_nerdfont/", import.meta.url),
    ),
    text,
  );
}

await download("basename.json");
await download("extension.json");
await download("pattern.json");
