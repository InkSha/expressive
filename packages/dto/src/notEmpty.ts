import { Validator, type BaseConfig, addValidator } from "./base"

export type NotEmptyConfig = Partial<{
  ignoreUndefined: boolean
  ignoreNull: boolean
  ignoreZero: boolean
  ignoreEmpty: boolean
}>

export const notEmpty: BaseConfig<NotEmptyConfig>["verify"] = (
  val: unknown,
  config: NotEmptyConfig = {
    ignoreEmpty: false,
    ignoreNull: false,
    ignoreUndefined: false,
    ignoreZero: true,
  },
) => {
  if (config) {
    const buildInfo = Validator.failureInfo<NotEmptyConfig>

    if (val === undefined && !config.ignoreUndefined) {
      return buildInfo("should not undefined", "ignoreUndefined")
    }
    if (val === null && !config.ignoreNull) {
      return buildInfo("should not null", "ignoreNull")
    }
    if (val === 0 && !config.ignoreZero) {
      return buildInfo("should not zero", "ignoreZero")
    }

    if (
      [JSON.stringify([]), JSON.stringify({}), JSON.stringify("")].includes(JSON.stringify(val)) &&
      !config.ignoreEmpty
    ) {
      return buildInfo("is empty", "ignoreEmpty")
    }
  }
  return [true, "", ""]
}

export const NotEmpty =
  (config?: NotEmptyConfig): PropertyDecorator =>
  (target, property) => {
    addValidator(target, property, { config, verify: notEmpty })
  }
