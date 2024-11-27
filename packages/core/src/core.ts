import "reflect-metadata"
import { type Constructor } from "@expressive/common"
import express from "express"
import cors from "cors"
import { Entities } from './entities'
import { ModuleNode } from './node'
import { Router } from './router'

export class AppCore {
  private readonly app = express()
  private entityManager = new Entities()
  private root: ModuleNode

  constructor(
    module: Constructor
  ) {
    this.app.use(cors())
    this.app.use(express.urlencoded({ extended: true }))
    this.app.use(express.json())
    this.root = new ModuleNode(module).getTree()
    this.bootstrap()
  }

  private instance(root = this.root) {
    this.entityManager.toEntity(root.prototype, root.module.services)
    for (const node of root) {
      this.instance(node)
    }

    for (const Controller of root.module.controllers) {
      const controller = this.entityManager.toEntity(Controller, root.module.services)
      const router = new Router(Controller).bindRouter(controller)
      this.app.use(router)
    }
  }

  private bootstrap() {
    this.instance()
  }

  public start(port = 3000, callback = () => {}) {
    this.app.listen(port, callback)
  }
}
