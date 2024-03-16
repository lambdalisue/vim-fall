export const UNICODE_SPINNER = ["⣾", "⣷", "⣯", "⣟", "⡿", "⢿", "⣻", "⣽"];
export const ASCII_SPINNER = ["|", "/", "—", "\\"];

const UPDATE_INTERVAL = 100;

export class Spinner implements Disposable {
  #index = 0;
  #locked = false;
  #lockTimer?: number;
  #interval: number;
  #spinner: string[];

  constructor(spinner: string[] = UNICODE_SPINNER, interval = UPDATE_INTERVAL) {
    this.#spinner = spinner;
    this.#interval = interval;
    globalThis.addEventListener("unload", () => {
      this[Symbol.dispose]();
    });
  }

  next(): string {
    if (!this.#locked) {
      this.#index = (this.#index + 1) % this.#spinner.length;
      this.#locked = true;
      this.#lockTimer = setTimeout(() => {
        this.#locked = false;
      }, this.#interval);
    }
    return this.#spinner[this.#index];
  }

  [Symbol.dispose]() {
    clearTimeout(this.#lockTimer);
  }
}
