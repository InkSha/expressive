import { Constructor, ModuleConfig, TokenConfig } from '@expressive/common'

export class ModuleNode {
  public static root: ModuleNode | null = null
  public static globals = {
    providers: new Map<Constructor, ModuleNode>()
  }

  private node: AppModule
  private children: ModuleNode[] = []

  constructor(
    module: Constructor
  ) {
    this.node = new AppModule(module)

    if (!ModuleNode.root) {
      ModuleNode.root = this
    }

    this.mount()
  }

  private mount() {
    if (!this.node.imports.length) {
      return
    }

    for (const module of this.node.imports) {
      if (!this.hasModule(module) && !this.hasGlobals(module)) {
        const m = new ModuleNode(module)

        if (m.node.global) {
          ModuleNode.globals.providers.set(module, m)
        }
        else this.children.push(m)
      }
    }
  }

  private static injectGlobal(module: ModuleNode, globals: ModuleNode[]) {
    module.node.injectGlobalsImport(globals)

    for (const leaf of module) {
      ModuleNode.injectGlobal(leaf, globals)
    }
  }

  public getTree() {
    return ModuleNode.getTree()
  }

  public static getTree() {
    if (ModuleNode.root) {
      ModuleNode.injectGlobal(ModuleNode.root, Array.from(ModuleNode.globals.providers.values()))
    }

    return ModuleNode.root
  }

  public hasGlobals(module: Constructor): boolean {
    return ModuleNode.globals.providers.has(module)
  }

  public hasModule(module: Constructor): boolean {
    if (this.prototype === module) return true

    for (const leaf of this) {
      if (leaf.hasModule(module)) {
        return true
      }
    }

    return false
  }

  public get module() {
    return this.node
  }

  public get prototype() {
    return this.node.prototype
  }

  public [Symbol.iterator]() {
    let index = 0
    const list = this.children
    return {
      next: () => {
        return index < list.length
          ? ({ value: list[index++], done: false })
          : ({ value: null, done: true })
      }
    }
  }

  public toString() {
    return this.node.name
  }
}


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

  public injectGlobalsImport(imports: ModuleNode[]) {
    this.providers = imports.flatMap(module => module.module.providers)
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
