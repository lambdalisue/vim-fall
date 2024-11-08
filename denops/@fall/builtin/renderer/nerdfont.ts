import basenameJson from "./_nerdfont/basename.json" with { type: "json" };
import extensionJson from "./_nerdfont/extension.json" with { type: "json" };
import patternJson from "./_nerdfont/pattern.json" with { type: "json" };

import { basename } from "jsr:@std/path@^1.0.8/basename";
import { extname } from "jsr:@std/path@^1.0.8/extname";

import { defineRenderer, type Renderer } from "../../renderer.ts";
import { getByteLength } from "../_util.ts";

type Detail = {
  path: string;
};

export function nerdfont<T extends Detail>(): Renderer<T> {
  return defineRenderer<T>((_denops, { items }) => {
    items.forEach((item) => {
      const { path } = item.detail;
      const icon = fromPattern(path) ??
        fromBasename(path) ??
        fromExtension(path);
      if (!icon) return;
      const prefix = `${icon}  `;
      const offset = getByteLength(prefix);
      item.label = `${prefix}${item.label}`;
      item.decorations = item.decorations.map((v) => ({
        ...v,
        column: offset + v.column,
      }));
    });
  });
}

function fromPattern(path: string): string | undefined {
  for (const [pattern, value] of Object.entries(patternJson)) {
    try {
      if (new RegExp(pattern).test(path)) {
        return value;
      }
    } catch {
      // ignore
    }
  }
}

function fromBasename(path: string): string | undefined {
  const base = basename(path).toLowerCase();
  return (basenameJson as Record<string, string>)[base];
}

function fromExtension(path: string): string | undefined {
  const base = extname(path).toLowerCase().replace(/^\./, "");
  return (extensionJson as Record<string, string>)[base];
}
