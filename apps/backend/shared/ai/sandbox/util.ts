import truncate from 'lodash/truncate.js';

// Reject when `promise` doesn't settle in time.
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message: string,
): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

// Shortens text to `max` characters, never splitting a character (e.g. emoji).
export function clip(text: string, max: number): string {
  return truncate(text, { length: max, omission: '…' });
}

// What an interaction returned, as short text for the model.
export function describeInteractionResult(value: unknown, max: number): string {
  try {
    return clip(JSON.stringify(value), max);
  } catch {
    // BigInt and circular values can't be serialized.
    return clip(String(value), max);
  }
}
