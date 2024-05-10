export function getByteLength(str: string): number {
  return new TextEncoder().encode(str).length;
}
