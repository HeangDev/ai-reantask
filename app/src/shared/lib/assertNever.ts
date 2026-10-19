/** Makes a `switch` over a union exhaustive: adding a case without handling it is a compile error. */
export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${String(value)}`)
}
