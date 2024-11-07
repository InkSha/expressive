import { Validator, type BaseConfig, addValidator } from "./base"

export type IsBooleanConfig = Partial<{
  isTrue: boolean
  isFalse: boolean
}>

export const isBoolean = (val: unknown): val is boolean => val === true || val === false

export const is_boolean: BaseConfig<IsBooleanConfig>["verify"] = (val, config) => {
  if (isBoolean(val)) {
    const buildInfo = Validator.failureInfo<IsBooleanConfig>
    if (config.isFalse && val !== false) {
      return buildInfo("not is false", "isFalse")
    }
    if (config.isTrue && val !== true) {
      return buildInfo("not is true", "isTrue")
    }
    return [true, "", ""]
  }
  return Validator.failureInfo("not boolean", "")
}

export const IsBoolean =
  (config?: IsBooleanConfig): PropertyDecorator =>
  (target, property) => {
    addValidator(target, property, { config, verify: is_boolean })
  }
