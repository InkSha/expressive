import { getGlobal } from "@expressive/shared"

export interface BaseConfig<C = Record<string, unknown>> {
  config: C
  verify: (val: unknown, config: C) => [boolean, string, string]
  reason?: Record<keyof C, string>
  first?: number
  failureContinue?: boolean
  skipOtherValidator?: boolean
}

export class Validator {
  private object: Map<Object, Map<string | symbol, BaseConfig[]>>

  constructor() {
    const global = getGlobal()
    if (global.validator) {
      this.object = global.validator
    } else {
      this.object = global.validator = new Map()
    }
  }

  public hasValidator(target: Object): boolean {
    return this.object.has(target)
  }

  public addValidator(
    target: Object,
    property: string | symbol,
    {
      config = {},
      reason = {},
      first = 0,
      verify = () => [true, "", ""],
      failureContinue = false,
      skipOtherValidator = false,
    }: BaseConfig,
  ) {
    const map = this.object.get(target) || new Map()
    const validators: BaseConfig[] = map.has(property) ? map.get(property) : []

    validators.push({ config, reason, verify, first, skipOtherValidator, failureContinue })
    map.set(property, validators)
    this.object.set(target, map)
  }

  public validatorObject(target: Object): [boolean, string] {
    if (this.object.has(target.constructor)) {
      const validators = this.object.get(target.constructor)

      for (const [property, configs] of validators.entries()) {
        for (const {
          verify,
          config,
          reason = {},
          skipOtherValidator,
          failureContinue,
        } of configs.sort((a, b) => b.first - a.first)) {
          const [pass, msg, key] = verify(target[property], config)

          if (!pass && !failureContinue) {
            return [pass, key in reason ? reason[key] : `${String(property)} ${msg}`]
          }

          if (pass && skipOtherValidator) {
            break
          }
        }
      }
    }
    return [true, ""]
  }

  public static failureInfo<Config extends {} = Record<string, unknown>>(
    msg: string,
    property: keyof Config,
  ): [boolean, string, keyof Config] {
    return [false, msg, property]
  }
}

export const parseDTO: Validator["validatorObject"] = (target) =>
  new Validator().validatorObject(target)

export const addValidator: Validator["addValidator"] = (target, property, config) => {
  new Validator().addValidator(target.constructor, property, config)
}

export const hasValidator: Validator["hasValidator"] = (target) =>
  new Validator().hasValidator(target)
