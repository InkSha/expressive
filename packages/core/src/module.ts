import { Constructor, Middleware, Module, ModuleConfig, Pipe, Provider, ProviderType, TokenConfig, UseMiddleware, UsePipe } from '@expressive/common'
import { Entities } from './entities'

export class AppModule implements ModuleConfig {

  public readonly global: boolean

  private static Modules = new Map<Constructor, AppModule>()
  private static Manager = new Entities()
  private readonly _providers: Provider[]
  private readonly _imports: Constructor[]
  private readonly _exports: Constructor[]
  private readonly _controllers: Constructor[]

  constructor(
    private readonly module: Constructor
  ) {
    this.isModule(module)
    this.global = this.isGlobal(module)

    const {
      providers,
      imports,
      exports,
      controllers
    } = this.parseMetadata(module)

    this._providers = providers
    this._imports = imports
    this._exports = exports
    this._controllers = controllers

    AppModule.Modules.set(module, this)
  }

  public static generateModule(config: ModuleConfig) {
    @Module(config)
    class BaseModule {}

    return BaseModule
  }

  public static getInstance(module: Constructor) {
    const has = AppModule.Modules.has(module)
    return has ? AppModule.Modules.get(module) : new AppModule(module)
  }

  public injectGlobalsProvider(providers: Provider[]) {
    const pipes = providers.filter(provider => provider.type === ProviderType.PIPE).map(({ provider: pipe }) => {
      if (pipe.prototype instanceof Pipe) return pipe as Constructor<Pipe>

      throw new TypeError(`${pipe.name} is not pipe!`)
    })

    const middlewares = providers.filter(provider => provider.type === ProviderType.MIDDLEWARE).map(({ provider: middleware }) => {
      if (middleware.prototype instanceof Middleware) return middleware as Constructor<Middleware>
      throw new TypeError(`${middleware.name} is not middleware!`)
    })

    this.controllers.map(controller => {
      const _providers = providers.filter(({ type }) => type === ProviderType.SERVICE).map(({ provider }) => provider)
      UsePipe(...pipes.map(Pipe => AppModule.Manager.toEntity(Pipe, _providers)))(controller)
      UseMiddleware(...middlewares.map(Middleware => AppModule.Manager.toEntity(Middleware, _providers)))(controller)
    })
  }

  public injectGlobalsImport(imports: AppModule[]) {
    const globalProviders = imports.flatMap(module => module.providers)
    this.providers = globalProviders
    this.providers = this.imports.flatMap(m => AppModule.Modules.get(m).exports)
      .map(provider => ({ type: ProviderType.SERVICE, provider }))
    this.imports = imports.map(module => module.prototype)

    this.injectGlobalsProvider(globalProviders)
  }

  public get name() {
    return this.module.name
  }

  public get prototype() {
    return this.module
  }

  public set providers(providers) {
    for (const provider of providers) {
      if (!this._providers.includes(provider)) {
        this._providers.push(provider)
      }
    }
  }

  public get services() {
    return this._providers.filter(({ type }) => type === ProviderType.SERVICE).map(({ provider }) => provider)
  }

  public get providers() {
    return this._providers
  }

  public set imports(imports) {
    for (const module of imports) {
      if (!this._imports.includes(module)) {
        this._imports.push(module)
      }
    }
  }

  public get imports() {
    //
    // e.g. imports = [ NormalModuleA, GlobalModuleB ]
    //
    // first parse ModuleA
    // but NormalModuleA use GlobalModuleB providers
    // because GlobalModuleB not instance for now
    // so NormalModuleA not use providers
    // and throw type error
    // so that we need sort it's
    // global module need to first
    // normal module need to last
    return this._imports.sort((a, b) => +this.isGlobal(b) - +this.isGlobal(a))
  }

  public get controllers() {
    return this._controllers
  }

  public get exports() {
    return this._exports
  }

  protected parseMetadata(module: Constructor): Omit<ModuleConfig, 'providers'> & { providers: Provider[] } {
    const controllers = Reflect.getMetadata(TokenConfig.ModuleControllers, module)
    const providers = Reflect.getMetadata(TokenConfig.ModuleProviders, module)
    const exports = Reflect.getMetadata(TokenConfig.ModuleExports, module)
    const imports = Reflect.getMetadata(TokenConfig.ModuleImports, module)
    return { controllers, providers, exports, imports }
  }

  protected isModule(module: Constructor) {
    if (!Reflect.hasMetadata(TokenConfig.Moudle, module)) {
      throw new TypeError(`${module.name} Not Module!`)
    }
    return true
  }

  protected isGlobal(module: Constructor) {
    return Reflect.hasMetadata(TokenConfig.Global, module) &&
      Reflect.getMetadata(TokenConfig.Global, module)
  }
}
