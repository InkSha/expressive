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
      const {
        controllers = [],
        providers = [],
        exports = [],
        imports = []
      } = config

      Reflect.defineMetadata(TokenConfig.Moudle, true, target)
      Reflect.defineMetadata(TokenConfig.ModuleControllers, controllers, target)
      Reflect.defineMetadata(TokenConfig.ModuleProviders, providers, target)
      Reflect.defineMetadata(TokenConfig.ModuleExports, exports, target)
      Reflect.defineMetadata(TokenConfig.ModuleImports, imports, target)
    }

export type Globals = () => ClassDecorator

export const Globals: Globals = () => (target) => Reflect.defineMetadata(TokenConfig.Global, true, target)
