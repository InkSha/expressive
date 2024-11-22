import "reflect-metadata"
import { type Constructor } from "@expressive/common"
import express from "express"
import cors from "cors"
import { Entities } from './entities'
import { ModuleNode } from './module'

export class AppCore {
  // private readonly app = express()
  private entityManager = new Entities()
  private root: ModuleNode
  private globals = {
    providers: [] as Constructor[]
  }

  constructor(
    module: Constructor
  ) {
    // this.app.use(cors())
    // this.app.use(express.urlencoded({ extended: true }))
    // this.app.use(express.json())
    this.root = new ModuleNode(module)
    this.bootstrap()
  }

  private instance(root = this.root) {
    this.entityManager.toEntity(root.prototype, [].concat(root.module.providers, this.globals.providers))

    if (root.module.global) {
      for (const provider of root.module.providers) {
        if (!this.globals.providers.includes(provider)) {
          this.globals.providers.push(provider)
        }
      }
    }

    for (const node of root) {
      this.instance(node)
    }
  }

  private bootstrap() {
    this.instance()
  }
}
