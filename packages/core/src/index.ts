import "reflect-metadata"
import { type Constructor, type ModuleConfig, TokenConfig } from "@expressive/common"
import express from "express"
import { Router } from "./router"

export class AppFactory {
  private readonly app = express()
  private entity: Map<Constructor, Object> = new Map()

  constructor(module: Constructor) {
    this.parseModule(module)
  }
  private parseModule(module: Constructor) {
    if (!Reflect.hasMetadata(TokenConfig.Moudle, module)) {
      throw new TypeError(`${module.name} Not Module!`)
    }

    const { providers, controllers, imports, exports } = Reflect.getMetadata(
      TokenConfig.Moudle,
      module,
    ) as ModuleConfig

    const importProviders = imports.map(this.parseModule).flatMap((config) => config.providers)

    for (const controller of controllers) {
      this.app.use(this.parseController(controller, [...providers, ...importProviders]))
    }

    return {
      providers,
      controllers,
    }
  }

  private toEntity(proto: Constructor, providers: Constructor[] = []) {
    if (this.entity.has(proto)) return this.entity.get(proto)

    const params = []

    try {
      const args = Reflect.getMetadata("design:paramtypes", proto) as Constructor[]
      //
      // proto = class protot { constructor(private readonly provider1, private readonly provider2) {} }
      // args = [provider1, provider2]
      //
      // start instance providers
      //
      params.push(...args.map((fn) => this.toEntity(fn, providers)))
    } catch {}

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
