/**
 * Ensure that the given value is a promise.
 */
export function promish<T>(v: T | Promise<T>): Promise<T> {
  return v instanceof Promise ? v : Promise.resolve(v);
}

/**
 * Parse the expression into the name and the variant.
 */
export function parseExpr(expr: string): [string, string | undefined] {
  const [name, ...rest] = expr.split(":");
  if (rest.length === 0) {
    return [name, undefined];
  }
  return [name, rest.join(":")];
}

/**
 * Parse the pattern into the expressions.
 */
export function parsePattern(pattern: string, exprs: string[]): string[] {
  if (!pattern.includes("*")) {
    return [pattern];
  }
  const [head, tail, ...rest] = pattern.split("*");
  if (rest.length > 0) {
    throw new Error("Only one '*' is allowed in the expression.");
  }
  return exprs.filter((expr) => expr.startsWith(head) && expr.endsWith(tail));
}
