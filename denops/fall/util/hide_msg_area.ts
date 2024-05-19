import type { Denops } from "https://deno.land/x/denops_std@v6.4.0/mod.ts";

export async function hideMsgArea(denops: Denops): Promise<AsyncDisposable> {
  await using stack = new AsyncDisposableStack();
  stack.defer(async () => {
    await denops.call("fall#internal#msgarea#show");
  });
  await denops.call("fall#internal#msgarea#hide");
  const moved = stack.move();
  return {
    [Symbol.asyncDispose]: async () => {
      await moved.disposeAsync();
    },
  };
}
