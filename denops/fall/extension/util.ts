export function expand(expr: string, names: string[]): string[] {
  if (!expr.includes("*")) {
    return [expr];
  }
  const [head, tail, ...rest] = expr.split("*");
  if (rest.length > 0) {
    throw new Error("Only one '*' is allowed in the expression.");
  }
  return names.filter((name) => name.startsWith(head) && name.endsWith(tail));
}
