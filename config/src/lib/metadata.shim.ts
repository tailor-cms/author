export {};
declare global {
  interface SymbolConstructor {
    readonly metadata: unique symbol;
  }
}
// @ts-expect-error Symbol.metadata polyfill
Symbol.metadata ??= Symbol.for('Symbol.metadata');
