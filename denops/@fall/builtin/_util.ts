const encoder = new TextEncoder();

export function getByteLength(str: string): number {
  return encoder.encode(str).length;
}

export function splitText(text: string): string[] {
  const lines = text.split(/\r?\n/g);
  return lines.at(-1) === "" ? lines.slice(0, -1) : lines;
}
