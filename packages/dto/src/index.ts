export * from "./isArray"
export * from "./isBoolean"
export * from "./isNumber"
export * from "./isObject"
export * from "./isString"
export * from "./isOptional"
export * from "./notEmpty"
export * from "./base"

export const assignmentObject = <T>(raw: new (...args: unknown[]) => T, data: Object) => {
  const obj = new raw()
  for (const key of Object.keys(obj)) {
    obj[key] = data[key]
  }
  return obj
}
