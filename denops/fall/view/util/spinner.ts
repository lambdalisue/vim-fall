export const UNICODE_SPINNER = ["⣾", "⣷", "⣯", "⣟", "⡿", "⢿", "⣻", "⣽"];
export const ASCII_SPINNER = ["|", "/", "—", "\\"];

const UPDATE_INTERVAL = 100;

export class Spinner {
  #index = 0;
  #lastCalled = 0;
  #interval: number;
  #spinner: string[];

  constructor(spinner: string[] = UNICODE_SPINNER, interval = UPDATE_INTERVAL) {
    this.#spinner = spinner;
    this.#interval = interval;
  }

  next(): string {
    const index = this.#index;
    if (this.#lastCalled + this.#interval < performance.now()) {
      this.#index = (index + 1) % this.#spinner.length;
      this.#lastCalled = performance.now();
    }
    return this.#spinner[index];
  }
}
