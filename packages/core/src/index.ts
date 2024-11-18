import "reflect-metadata"
import { type Constructor, type ModuleConfig, TokenConfig } from "@expressive/common"
import express from "express"
import cors from "cors"
import { Router } from "./router"

export class AppFactory {
  private readonly app = express()
  private entity: Map<Constructor, Object> = new Map()
  private globals = {
    providers: new Set<Constructor>()
  }

  constructor(module: Constructor) {
    this.app.use(cors())
    this.app.use(express.urlencoded({ extended: true }))
    this.app.use(express.json())
    this.parseModule(module)
  }

  private parseModule(module: Constructor) {
    if (!Reflect.hasMetadata(TokenConfig.Moudle, module)) {
      throw new TypeError(`${module.name} Not Module!`)
    }

    const isGlobal = this.judgeIsGlobal(module)

    const { providers, controllers, imports, exports } = Reflect.getMetadata(
      TokenConfig.Moudle,
      module,
    ) as ModuleConfig

    const importProviders = Array.from(new Set(imports.sort((a, b) => {
      if (this.judgeIsGlobal(a)) return -1
      if (this.judgeIsGlobal(b)) return 1
      return 0
    }).flatMap((m) => this.parseModule(m))))

    if (isGlobal) {
      exports.map(provider => this.globals.providers.add(provider))
    }

    for (const controller of controllers) {
      this.app.use(this.parseController(controller, [].concat(providers, importProviders, Array.from(this.globals.providers))))
    }


    return exports
  }

  private judgeIsGlobal(module: Constructor) {
    return Reflect.hasMetadata(TokenConfig.Global, module) && Reflect.getMetadata(TokenConfig.Global, module)
  }

  private toEntity(proto: Constructor, providers: Constructor[] = []) {
    if (this.entity.has(proto)) return this.entity.get(proto)

    // not constructor fn not have params
    const args = (Reflect.getMetadata("design:paramtypes", proto) as Constructor[]) || []
    const params = args.map((fn) => {
      if (!providers.some((p) => p === fn)) {
        throw new EvalError(`${fn.name} not in providers`)
      }

      return this.toEntity(fn, providers)
    })

    const entity = new proto(...params)

    this.entity.set(proto, entity)

    return entity
  }

  private parseController(controller: Constructor, providers?: Constructor[]) {
    const entity = this.toEntity(controller, providers)
    return new Router(controller).bindRouter(entity)
  }

  public start(port = 3000) {
    this.app.listen(port, () => {
      console.log("run")
    })
  }
}
