/**
 * ChunkStream is a TransformStream that chunks the input into arrays of a given size.
 */
export class ChunkStream<T> extends TransformStream<T, T[]> {
  #chunks: T[] = [];
  #size: number;

  constructor(size: number) {
    super({
      transform: (chunk, controller) => {
        this.#chunks.push(chunk);
        if (this.#chunks.length === this.#size) {
          controller.enqueue(this.#chunks);
          this.#chunks = [];
        }
      },
      flush: (controller) => {
        if (this.#chunks.length > 0) {
          controller.enqueue(this.#chunks);
        }
      },
    });
    this.#size = size;
  }
}
