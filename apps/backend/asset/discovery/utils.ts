const MAX_LENGTH = 500;

// Truncate a string to max length, coercing nullish to empty.
export function truncate(value: unknown, max = MAX_LENGTH): string {
  return String(value ?? '').slice(0, max);
}
