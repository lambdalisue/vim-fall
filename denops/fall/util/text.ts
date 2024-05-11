const encoder = new TextEncoder();

/**
 * Get byte length of the string.
 */
export function getByteLength(str: string): number {
  return encoder.encode(str).length;
}
