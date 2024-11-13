/**
 * Chunker that holds items in a fixed-size buffer.
 */
export class Chunker<T> {
  readonly #capacity: number;
  readonly #items: T[];
  #count = 0;

  constructor(capacity: number) {
    if (capacity <= 0) {
      throw new Error("capacity must be positive");
    }
    this.#capacity = capacity;
    this.#items = Array.from({ length: capacity });
  }

  /**
   * The number of items in the chunker.
   */
  get count(): number {
    return this.#count;
  }

  /**
   * Put an item into the chunker.
   * It returns whether the chunker is full and users should consume the items.
   *
   * @param item - The item to put.
   * @returns Whether the chunker is full.
   */
  put(item: Readonly<T>): boolean {
    if (this.#count >= this.#capacity) {
      throw new Error("Chunker is full");
    }
    this.#items[this.#count++] = item;
    return this.#count >= this.#capacity;
  }

  /**
   * Consume the items in the chunker.
   * It (virtually) removes the items from the chunker.
   */
  consume(): Iterable<Readonly<T>> {
    if (this.#count === this.#capacity) {
      this.#count = 0;
      // we don't need to copy the array if it's full
      return this.#items;
    }
    // NOTE:
    // It seems copying the array is faster than using a generator.
    const ref = this.#items.slice(0, this.#count);
    this.#count = 0;
    return ref;
  }
}
