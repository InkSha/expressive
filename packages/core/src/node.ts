import { Constructor, Globals } from '@expressive/common'
import { AppModule } from './module'

export class ModuleNode {
  private static _root: ModuleNode | null
  private static _globals = new Map<Constructor, ModuleNode>()

  private node: AppModule
  private children: ModuleNode[] = []

  constructor(
    module: Constructor
  ) {
    this.node = AppModule.getInstance(module)

    if (!ModuleNode._root) {
      const Deps = AppModule.generateModule({
        controllers: [],
        providers: this.module.providers,
        imports: [],
        exports: []
      })
      Globals()(Deps)
      this.module.imports.push(Deps)
      ModuleNode._root = this
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
          ModuleNode.globals.set(module, m)
        }
        else this.children.push(m)
      }
    }
  }

  private static injectGlobal(module: ModuleNode, globals: ModuleNode[]) {
    module.node.injectGlobalsImport(globals.map(node => node.module))

    for (const leaf of module) {
      ModuleNode.injectGlobal(leaf, globals)
    }
  }

  public getTree() {
    return ModuleNode.getTree()
  }

  public static getTree() {
    if (ModuleNode.root) {
      ModuleNode.injectGlobal(ModuleNode.root, Array.from(ModuleNode.globals.values()))
    }

    return ModuleNode.root
  }

  public hasGlobals(module: Constructor): boolean {
    return ModuleNode.globals.has(module)
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

  public static get root() {
    return ModuleNode._root
  }

  public static get globals() {
    return ModuleNode._globals
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
