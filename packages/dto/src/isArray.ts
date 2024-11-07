import { Validator, type BaseConfig, addValidator } from "./base"
export const isArray = Array.isArray

export type IsArrayConfig = Partial<{
  maxLength: number
  minLength: number
  equalLength: number
  notEqualLength: number
}>

export const is_array: BaseConfig<IsArrayConfig>["verify"] = (val, config) => {
  if (isArray(val)) {
    const buildInfo = Validator.failureInfo<IsArrayConfig>

    if (config.equalLength && val.length !== config.equalLength) {
      return buildInfo(`length not equal ${config.equalLength}`, "equalLength")
    }
    if (config.maxLength && val.length > config.maxLength) {
      return buildInfo(`length larger than ${config.maxLength}`, "maxLength")
    }
    if (config.minLength && val.length < config.minLength) {
      return buildInfo(`length smaller than ${config.minLength}`, "minLength")
    }
    if (config.notEqualLength && val.length === config.notEqualLength) {
      return buildInfo(`length should not equal ${config.notEqualLength}`, "notEqualLength")
    }

    return [true, "", ""]
  }
  return Validator.failureInfo("not array", "")
}

export const IsArray =
  (config?: IsArrayConfig): PropertyDecorator =>
  (target, property) => {
    addValidator(target, property, { config, verify: is_array })
  }
