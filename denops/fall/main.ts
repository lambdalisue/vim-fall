import "./lib/polyfill.ts";

import type { Entrypoint } from "jsr:@denops/std@^7.3.0";
import { main as mainPicker } from "./main/picker.ts";
import { main as mainEvent } from "./main/event.ts";

export const main: Entrypoint = async (denops) => {
  await mainPicker(denops);
  await mainEvent(denops);
};
