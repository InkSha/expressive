import { addValidator } from "./base"
import { notEmpty, type NotEmptyConfig } from "./notEmpty"

export const IsOptional = (): PropertyDecorator => (target, property) => {
  const config: NotEmptyConfig = { ignoreUndefined: true }
  addValidator(target, property, { config, verify: notEmpty, first: 999, skipOtherValidator: true })
}
