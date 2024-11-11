import { addValidator, type BaseConfig } from "./base"

export type IsOptionalConfig = Partial<{}>

export const isOptional: BaseConfig<IsOptionalConfig>["verify"] = (val, config) => {
  if (val === undefined) return [true, "", ""]
  return [false, "val defined", ""]
}

export const IsOptional =
  (config?: IsOptionalConfig): PropertyDecorator =>
  (target, property) => {
    addValidator(target, property, {
      config,
      verify: isOptional,
      first: 999,
      failureContinue: true,
      skipOtherValidator: true,
    })
  }
