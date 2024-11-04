import { TokenConfig } from "./token"

export type Constructor = new (...args: unknown[]) => {}

export type ModuleConfig = {
  controllers: Constructor[]
  providers: Constructor[]
  imports: Constructor[]
  exports: Constructor[]
}

export type Module = (config?: Partial<ModuleConfig>) => ClassDecorator

export const Module: Module =
  (config = {}) =>
  (target) => {
    config.controllers ??= []
    config.providers ??= []
    config.exports ??= []
    config.imports ??= []

    Reflect.defineMetadata(TokenConfig.Moudle, config, target)
  }
