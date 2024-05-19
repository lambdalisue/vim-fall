export type Predicator<T> = (chunks: T[]) => boolean;

/**
 * DynamicChunkStream is a TransformStream that chunks the input into arrays.
 *
 * It enqueues chunks when the given predicator returns true.
 */
export class DynamicChunkStream<T> extends TransformStream<T, T[]> {
  #chunks: T[] = [];
  #predicator: Predicator<T>;

  constructor(predicator: Predicator<T>) {
    super({
      transform: (chunk, controller) => {
        this.#chunks.push(chunk);
        if (this.#predicator(this.#chunks)) {
          controller.enqueue(this.#chunks);
          this.#chunks = [];
        }
      },
      flush: (controller) => {
        if (this.#chunks.length > 0) {
          controller.enqueue(this.#chunks);
          this.#chunks = [];
        }
      },
    });
    this.#predicator = predicator;
  }
}
