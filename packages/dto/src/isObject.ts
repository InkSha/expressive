import { Validator, type BaseConfig, addValidator } from "./base"

export const isObject = (val: unknown): val is Object => typeof val === "object"

export type IsObjectConfig = Partial<{
  schema: Record<string, unknown>
}>

export const is_object: BaseConfig<IsObjectConfig>["verify"] = (val, config) => {
  if (isObject(val)) {
    return [true, "", ""]
  }
  return Validator.failureInfo("not object", "")
}

export const IsObject =
  (config?: IsObjectConfig): PropertyDecorator =>
  (target, property) => {
    addValidator(target, property, { config, verify: is_object })
  }
