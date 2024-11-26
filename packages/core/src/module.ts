import { Constructor, ModuleConfig, TokenConfig } from '@expressive/common'

export class AppModule implements ModuleConfig {

  public readonly global: boolean

  private static Modules = new Map<Constructor, AppModule>()
  private readonly _providers: Constructor[]
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

  public static getInstance(module: Constructor) {
    const has = AppModule.Modules.has(module)
    return has ? AppModule.Modules.get(module) : new AppModule(module)
  }

  public injectGlobalsImport(imports: AppModule[]) {
    this.providers = imports.flatMap(module => module.providers)
    this.providers = this.imports.flatMap(m => AppModule.Modules.get(m).exports)
    this.imports = imports.map(module => module.prototype)
  }

  public get name() {
    return this.module.name
  }

  public get prototype() {
    return this.module
  }

  public set providers(providers) {
    for (const module of providers) {
      if (!this._providers.includes(module)) {
        this._providers.push(module)
      }
    }
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

  protected parseMetadata(module: Constructor): ModuleConfig {
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
