import { assertEquals } from "jsr:@std/assert@0.225.1";
import * as stream from "./stream.ts";

Deno.test("ChunkStream", async (t) => {
  await t.step("chunks the input stream", async () => {
    const chunks: number[][] = [];
    const rstream = ReadableStream.from([...Array(10).keys()]);
    await rstream.pipeThrough(new stream.ChunkStream(3)).pipeTo(
      new WritableStream({
        write(chunk) {
          chunks.push(chunk);
        },
      }),
    );
    assertEquals(chunks, [[0, 1, 2], [3, 4, 5], [6, 7, 8], [9]]);
  });

  await t.step("works with stream with smaller size", async () => {
    const chunks: number[][] = [];
    const rstream = ReadableStream.from([...Array(10).keys()]);
    await rstream.pipeThrough(new stream.ChunkStream(20)).pipeTo(
      new WritableStream({
        write(chunk) {
          chunks.push(chunk);
        },
      }),
    );
    assertEquals(chunks, [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]]);
  });

  await t.step("works with an empty stream", async () => {
    const chunks: number[][] = [];
    const rstream = ReadableStream.from([]);
    await rstream.pipeThrough(new stream.ChunkStream(3)).pipeTo(
      new WritableStream({
        write(chunk) {
          chunks.push(chunk);
        },
      }),
    );
    assertEquals(chunks, []);
  });
});
