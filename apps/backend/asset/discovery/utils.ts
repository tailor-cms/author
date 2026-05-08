// Truncate a string to max length, coercing nullish to empty.
export function truncate(value: unknown, max = 500): string {
  return String(value ?? '').slice(0, max);
}
