import { Chunker } from "./chunker.ts";

const ARRAY_SIZE = 100500;
const CHUNK_SIZE = 1000;

const source = Array.from({ length: ARRAY_SIZE }, (_, i) => i);

Deno.bench({
  name: "Chunker",
  group: "chunking",
  fn: (b) => {
    b.start();
    const results = [];
    const chunker = new Chunker<number>(CHUNK_SIZE);
    for (const item of source) {
      if (chunker.put(item)) {
        results.push(...chunker.consume());
      }
    }
    results.push(...chunker.consume());
    b.end();
  },
});

Deno.bench({
  name: "Naive",
  group: "chunking",
  fn: (b) => {
    b.start();
    const results = [];
    let chunk = [];
    for (const item of source) {
      chunk.push(item);
      if (chunk.length >= CHUNK_SIZE) {
        results.push(...chunk);
        chunk = [];
      }
    }
    if (chunk.length > 0) {
      results.push(...chunk);
    }
    b.end();
  },
});
