// Externally-resolvable promise: returns the promise together with its
// resolve/reject. A lint-safe stand-in for `Promise.withResolvers()`, which
// the repo's @typescript-eslint version rejects. Mirrors the backend Deferred.
export function deferred<T = void>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}
