import { assertEquals } from "jsr:@std/assert@^1.0.0";
import { DynamicChunkStream } from "./dynamic_chunk_stream.ts";

Deno.test("DynamicChunkStream", async (t) => {
  await t.step("chunks the input stream", async () => {
    const chunks: number[][] = [];
    const rstream = ReadableStream.from([...Array(10).keys()]);
    await rstream
      .pipeThrough(new DynamicChunkStream((chunks) => chunks.length >= 3))
      .pipeTo(
        new WritableStream({
          write(chunk) {
            chunks.push(chunk);
          },
        }),
      );
    assertEquals(chunks, [[0, 1, 2], [3, 4, 5], [6, 7, 8], [9]]);
  });

  await t.step("works with an empty stream", async () => {
    const chunks: number[][] = [];
    const rstream = ReadableStream.from([]);
    await rstream
      .pipeThrough(new DynamicChunkStream(() => false))
      .pipeTo(
        new WritableStream({
          write(chunk) {
            chunks.push(chunk);
          },
        }),
      );
    assertEquals(chunks, []);
  });

  await t.step("works when predicator always returns false", async () => {
    const chunks: number[][] = [];
    const rstream = ReadableStream.from([...Array(10).keys()]);
    await rstream
      .pipeThrough(new DynamicChunkStream(() => false))
      .pipeTo(
        new WritableStream({
          write(chunk) {
            chunks.push(chunk);
          },
        }),
      );
    assertEquals(chunks, [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]]);
  });
});
