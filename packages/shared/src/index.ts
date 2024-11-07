export function getGlobal() {
  if (typeof globalThis !== "undefined") {
    return globalThis
  }

  if (typeof global !== "undefined") {
    return global
  }

  // @ts-ignore: Cannot find name 'window'.
  if (typeof window !== "undefined") {
    // @ts-ignore: Cannot find name 'window'.
    return window
  }

  // @ts-ignore: Cannot find name 'self'.
  if (typeof self !== "undefined") {
    // @ts-ignore: Cannot find name 'self'.
    return self
  }
}
