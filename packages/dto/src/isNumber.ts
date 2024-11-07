import { Validator, type BaseConfig, addValidator } from "./base"

export const isNumber = (val: unknown): val is number => typeof val === "number"

export type IsNumberConfig = Partial<{
  max: number
  min: number
  equal: number
  notEqual: number
  inSet: number[]
}>

export const is_number: BaseConfig<IsNumberConfig>["verify"] = (val, config) => {
  if (isNumber(val)) {
    const buildInfo = Validator.failureInfo<IsNumberConfig>

    if (config.equal && config.equal !== val) {
      return buildInfo(`not equal ${config.equal}`, "equal")
    }
    if (config.inSet && !config.inSet.includes(val)) {
      return buildInfo(`not in ${config.inSet.join(",")}`, "inSet")
    }
    if (config.max && val > config.max) {
      return buildInfo(`larger than ${config.max}`, "max")
    }
    if (config.min && val < config.min) {
      return buildInfo(`smaller than ${config.min}`, "min")
    }
    if (config.notEqual && val === config.notEqual) {
      return buildInfo(`should not equal ${config.notEqual}`, "notEqual")
    }

    return [true, "", ""]
  }

  return Validator.failureInfo("not number", "")
}
export const IsNumber =
  (config?: IsNumberConfig): PropertyDecorator =>
  (target, property) => {
    addValidator(target, property, { config, verify: is_number })
  }
