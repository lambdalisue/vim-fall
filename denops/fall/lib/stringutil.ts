const encoder = new TextEncoder();

/**
 * Returns the byte length of a string.
 */
export function getByteLength(str: string): number {
  return encoder.encode(str).length;
}
