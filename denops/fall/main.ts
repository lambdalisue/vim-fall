import "./lib/polyfill.ts";

import type { Entrypoint } from "jsr:@denops/std@^7.3.2";

import { main as mainCustom } from "./main/custom.ts";
import { main as mainEvent } from "./main/event.ts";
import { main as mainPicker } from "./main/picker.ts";
import { main as mainSubmatch } from "./main/submatch.ts";

export const main: Entrypoint = async (denops) => {
  await mainCustom(denops);
  await mainEvent(denops);
  await mainPicker(denops);
  await mainSubmatch(denops);
};
