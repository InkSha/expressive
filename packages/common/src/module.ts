import { TokenConfig } from "./token"

export type Constructor<R = {}> = new (...args: unknown[]) => R

export enum ProviderType {
  SERVICE = 0,
  PIPE = 2,
  MIDDLEWARE = 4,
  GUARD = 8,
  INTERCEPT = 16,
  FILTER = 32,
}

export type Provider = { type: ProviderType, provider: Constructor }

export type ModuleConfig = {
  controllers: Constructor[]
  providers: (Provider | Constructor)[]
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
      Reflect.defineMetadata(TokenConfig.ModuleExports, exports, target)
      Reflect.defineMetadata(TokenConfig.ModuleImports, imports, target)
      Reflect.defineMetadata(TokenConfig.ModuleProviders, providers
        .map(provider =>
          typeof provider === 'function'
            ? { type: ProviderType.SERVICE, provider }
            : provider
        ), target)
    }

export type Globals = () => ClassDecorator

export const Globals: Globals = () => (target) => Reflect.defineMetadata(TokenConfig.Global, true, target)
