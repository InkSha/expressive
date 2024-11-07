import { Validator, type BaseConfig, addValidator } from "./base"
export const isString = (val: unknown): val is string => typeof val === "string"
export type IsStringConfig = Partial<{
  maxLength: number
  minLength: number
  equalLength: number
  notEqualLength: number
  inSet: string[]
  pattern: string
}>

export const is_string: BaseConfig<IsStringConfig>["verify"] = (val, config) => {
  if (isString(val)) {
    const buildInfo = Validator.failureInfo<IsStringConfig>

    if (config.equalLength && val.length !== config.equalLength) {
      return buildInfo(`length not equal ${config.equalLength}`, "equalLength")
    }
    if (config.inSet && !config.inSet.includes(val)) {
      return buildInfo(`not in ${config.inSet.join(",")}`, "inSet")
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
    if (config.pattern && !val.match(config.pattern)) {
      return buildInfo(`not match ${config.pattern}`, "pattern")
    }

    return [true, "", ""]
  }
  return Validator.failureInfo("not string", "")
}

export const IsString =
  (config?: IsStringConfig): PropertyDecorator =>
  (target, property) => {
    addValidator(target, property, { config, verify: is_string })
  }
